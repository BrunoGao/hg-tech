---
title: Kubernetes源码分析1-kubectl中Pod的创建流程
description: kubectl中Pod的创建流程。
publishdate: 2022-10-11
authors: LuckyLove
tags: ["云原生"]
---

**记得看代码中的注释哈，理解都在里面**

>源码基于v1.19

[(一)kubectl中Pod的创建流程](/architecture/2022/10/11/Kubernetes源码分析1-kubectl中Pod的创建流程)

[(二)设计模式Visitor的实现与发送pod创建请求的细节](/architecture/2022/10/13/Kubernetes源码分析2-设计模式Visitor的实现与发送pod创建请求的细节)

[(三)ApiServer之三大server及权限与数据存储](/architecture/2022/10/15/Kubernetes源码分析3-ApiServer之三大server及权限与数据存储)

[(四)kube-scheduler的启动和监控资源变化](/architecture/2022/10/19/Kubernetes源码分析4-kube-scheduler的启动和监控资源变化)

## 确立目标

1. 从`创建pod`的全流程入手，了解各组件的工作内容，组件主要包括以下
   1. kubectl
   2. kube-apiserver
   3. kube-scheduler
   4. kube-controller
   5. kubelet
2. 理解各个组件之间的相互协作，目前是`kubectl`

## 先写一个Pod的Yaml

```yaml
apiVersion: v1 
kind: Pod 
metadata: 
  name: nginx-pod 
spec:    
  containers:    
  - name: nginx     
    image: nginx:1.8 

```

## 部署Pod

```shell
kubectl create -f nginx_pod.yaml 

pod/nginx-pod created

```

提示创建成功

## 查询Pod

```shell
kubectl get pods  
NAME                     READY   STATUS              RESTARTS   AGE 
nginx-pod                1/1     Running             0          4m22s 

```

打印出状态：

- NAME - nginx-pod就是对应上面 `metadata.name`
- READY - 就绪的个数
- STATUS - 当前的状态，RUNNING表示运行中
- RESTARTS - 重启的次数
- AGE - 多久之前创建的(运行的时间)

## kubectl create 的调用逻辑

**我们的目标是查看`kubectl create -f nginx_pod.yaml` 这个命令是怎么运行的**

## Main

```go
在cmd/kubectl中
func main() {
 	// 如果不调用rand.Seed，每次重新运行这个main函数，rand下的函数返回值始终一致
	// Seed即随机的种子，每次用时间戳作为种子，就能保证随机性
	rand.Seed(time.Now().UnixNano())

        // 创建了kubectl命令的默认参数
	command := cmd.NewDefaultKubectlCommand()

	// TODO: once we switch everything over to Cobra commands, we can go back to calling
	// cliflag.InitFlags() (by removing its pflag.Parse() call). For now, we have to set the
	// normalize func and add the go flag set by hand.
	pflag.CommandLine.SetNormalizeFunc(cliflag.WordSepNormalizeFunc)
	pflag.CommandLine.AddGoFlagSet(goflag.CommandLine)
	// cliflag.InitFlags()
  
        // 日志的初始化与退出
	logs.InitLogs()
	defer logs.FlushLogs()

        // 运行command
	if err := command.Execute(); err != nil {
		os.Exit(1)
	}
}

```

## Match

```go
// k8s的命令行工具采用了 cobra 库，具有命令提示等强大功能，比go语言自带的flag强大很多，可参考 github.com/spf13/cobra
func NewDefaultKubectlCommand() *cobra.Command {
	return NewDefaultKubectlCommandWithArgs(NewDefaultPluginHandler(plugin.ValidPluginFilenamePrefixes), os.Args, os.Stdin, os.Stdout, os.Stderr)
}

func NewDefaultKubectlCommandWithArgs(pluginHandler PluginHandler, args []string, in io.Reader, out, errout io.Writer) *cobra.Command {
  // 初始化NewKubectlCommand，采用标准输入、输出、错误输出
	cmd := NewKubectlCommand(in, out, errout)

	if pluginHandler == nil {
		return cmd
	}

	if len(args) > 1 {
    // 这里为传入的参数，即 create -f nginx_pod.yaml 部分
		cmdPathPieces := args[1:]

		// 调用cobra的Find去匹配args
		if _, _, err := cmd.Find(cmdPathPieces); err != nil {
			if err := HandlePluginCommand(pluginHandler, cmdPathPieces); err != nil {
				fmt.Fprintf(errout, "%v\n", err)
				os.Exit(1)
			}
		}
	}

	return cmd
}

```

## Command

代码较长，选择关键性的内容进行讲解

```go
func NewKubectlCommand(in io.Reader, out, err io.Writer) *cobra.Command {
	warningHandler := rest.NewWarningWriter(err, rest.WarningWriterOptions{Deduplicate: true, Color: term.AllowsColorOutput(err)})
	warningsAsErrors := false

	// 创建主命令 告诉你kubectl该怎么用
	cmds := &cobra.Command{
		Use:   "kubectl",
		Short: i18n.T("kubectl controls the Kubernetes cluster manager"),
		Long: templates.LongDesc(`
      kubectl controls the Kubernetes cluster manager.

      Find more information at:
            https://kubernetes.io/docs/reference/kubectl/overview/`),
		Run: runHelp,
		// 初始化后，在运行指令前的钩子
		PersistentPreRunE: func(*cobra.Command, []string) error {
			rest.SetDefaultWarningHandler(warningHandler)
      // 这里是做pprof性能分析，跳转到对应代码可以看到，我们可以用参数 --profile xxx 来采集性能指标，默认保存在当前目录下的profile.pprof中
			return initProfiling()
		},
    // 运行指令后的钩子
		PersistentPostRunE: func(*cobra.Command, []string) error {
      // 保存pprof性能分析指标
			if err := flushProfiling(); err != nil {
				return err
			}
      // 打印warning条数
			if warningsAsErrors {
				count := warningHandler.WarningCount()
				switch count {
				case 0:
					// no warnings
				case 1:
					return fmt.Errorf("%d warning received", count)
				default:
					return fmt.Errorf("%d warnings received", count)
				}
			}
			return nil
		},
    // bash自动补齐功能，可通过 kubectl completion bash 命令查看
    // 具体安装可参考 https://kubernetes.io/docs/tasks/tools/install-kubectl/#enabling-shell-autocompletion
		BashCompletionFunction: bashCompletionFunc,
	}

  // 实例化Factory接口，工厂模式
	f := cmdutil.NewFactory(matchVersionKubeConfigFlags)

	// 省略实例化的过程代码

  // kubectl定义了7类命令，结合Message和各个子命令的package名来看
	groups := templates.CommandGroups{
		{
      // 1. 初级命令，包括 create/expose/run/set   
			Message: "Basic Commands (Beginner):",
			Commands: []*cobra.Command{
				create.NewCmdCreate(f, ioStreams),
				expose.NewCmdExposeService(f, ioStreams),
				run.NewCmdRun(f, ioStreams),
				set.NewCmdSet(f, ioStreams),
			},
		},
		{
      // 2. 中级命令，包括explain/get/edit/delete
			Message: "Basic Commands (Intermediate):",
			Commands: []*cobra.Command{
				explain.NewCmdExplain("kubectl", f, ioStreams),
				get.NewCmdGet("kubectl", f, ioStreams),
				edit.NewCmdEdit(f, ioStreams),
				delete.NewCmdDelete(f, ioStreams),
			},
		},
		{
      // 3. 部署命令，包括 rollout/scale/autoscale
			Message: "Deploy Commands:",
			Commands: []*cobra.Command{
				rollout.NewCmdRollout(f, ioStreams),
				scale.NewCmdScale(f, ioStreams),
				autoscale.NewCmdAutoscale(f, ioStreams),
			},
		},
		{
      // 4. 集群管理命令，包括 cerfificate/cluster-info/top/cordon/drain/taint
			Message: "Cluster Management Commands:",
			Commands: []*cobra.Command{
				certificates.NewCmdCertificate(f, ioStreams),
				clusterinfo.NewCmdClusterInfo(f, ioStreams),
				top.NewCmdTop(f, ioStreams),
				drain.NewCmdCordon(f, ioStreams),
				drain.NewCmdUncordon(f, ioStreams),
				drain.NewCmdDrain(f, ioStreams),
				taint.NewCmdTaint(f, ioStreams),
			},
		},
		{
      // 5. 故障排查和调试，包括 describe/logs/attach/exec/port-forward/proxy/cp/auth
			Message: "Troubleshooting and Debugging Commands:",
			Commands: []*cobra.Command{
				describe.NewCmdDescribe("kubectl", f, ioStreams),
				logs.NewCmdLogs(f, ioStreams),
				attach.NewCmdAttach(f, ioStreams),
				cmdexec.NewCmdExec(f, ioStreams),
				portforward.NewCmdPortForward(f, ioStreams),
				proxy.NewCmdProxy(f, ioStreams),
				cp.NewCmdCp(f, ioStreams),
				auth.NewCmdAuth(f, ioStreams),
			},
		},
		{
      // 6. 高级命令，包括diff/apply/patch/replace/wait/convert/kustomize
			Message: "Advanced Commands:",
			Commands: []*cobra.Command{
				diff.NewCmdDiff(f, ioStreams),
				apply.NewCmdApply("kubectl", f, ioStreams),
				patch.NewCmdPatch(f, ioStreams),
				replace.NewCmdReplace(f, ioStreams),
				wait.NewCmdWait(f, ioStreams),
				convert.NewCmdConvert(f, ioStreams),
				kustomize.NewCmdKustomize(ioStreams),
			},
		},
		{
      // 7. 设置命令，包括label，annotate，completion
			Message: "Settings Commands:",
			Commands: []*cobra.Command{
				label.NewCmdLabel(f, ioStreams),
				annotate.NewCmdAnnotate("kubectl", f, ioStreams),
				completion.NewCmdCompletion(ioStreams.Out, ""),
			},
		},
	}
	groups.Add(cmds)

	filters := []string{"options"}

	// alpha相关的子命令
	alpha := cmdpkg.NewCmdAlpha(f, ioStreams)
	if !alpha.HasSubCommands() {
		filters = append(filters, alpha.Name())
	}

	templates.ActsAsRootCommand(cmds, filters, groups...)

  // 代码补全相关
	for name, completion := range bashCompletionFlags {
		if cmds.Flag(name) != nil {
			if cmds.Flag(name).Annotations == nil {
				cmds.Flag(name).Annotations = map[string][]string{}
			}
			cmds.Flag(name).Annotations[cobra.BashCompCustom] = append(
				cmds.Flag(name).Annotations[cobra.BashCompCustom],
				completion,
			)
		}
	}

  // 添加其余子命令，包括 alpha/config/plugin/version/api-versions/api-resources/options
	cmds.AddCommand(alpha)
	cmds.AddCommand(cmdconfig.NewCmdConfig(f, clientcmd.NewDefaultPathOptions(), ioStreams))
	cmds.AddCommand(plugin.NewCmdPlugin(f, ioStreams))
	cmds.AddCommand(version.NewCmdVersion(f, ioStreams))
	cmds.AddCommand(apiresources.NewCmdAPIVersions(f, ioStreams))
	cmds.AddCommand(apiresources.NewCmdAPIResources(f, ioStreams))
	cmds.AddCommand(options.NewCmdOptions(ioStreams.Out))

	return cmds
}

```

## Create

```go
func NewCmdCreate(f cmdutil.Factory, ioStreams genericclioptions.IOStreams) *cobra.Command {
  // create子命令的相关选项
	o := NewCreateOptions(ioStreams)

  // create子命令的相关说明
	cmd := &cobra.Command{
		Use:                   "create -f FILENAME",
		DisableFlagsInUseLine: true,
		Short:                 i18n.T("Create a resource from a file or from stdin."),
		Long:                  createLong,
		Example:               createExample,
    // 验证参数并运行
		Run: func(cmd *cobra.Command, args []string) {
			if cmdutil.IsFilenameSliceEmpty(o.FilenameOptions.Filenames, o.FilenameOptions.Kustomize) {
				ioStreams.ErrOut.Write([]byte("Error: must specify one of -f and -k\n\n"))
				defaultRunFunc := cmdutil.DefaultSubCommandRun(ioStreams.ErrOut)
				defaultRunFunc(cmd, args)
				return
			}
			cmdutil.CheckErr(o.Complete(f, cmd))
			cmdutil.CheckErr(o.ValidateArgs(cmd, args))
      // 核心的运行代码逻辑是在这里的RunCreate
			cmdutil.CheckErr(o.RunCreate(f, cmd))
		},
	}

	o.RecordFlags.AddFlags(cmd)

	usage := "to use to create the resource"
  // 加入文件名选项的flag -f，保存到o.FilenameOptions.Filenames中，对应上面
	cmdutil.AddFilenameOptionFlags(cmd, &o.FilenameOptions, usage)
	cmdutil.AddValidateFlags(cmd)
	cmd.Flags().BoolVar(&o.EditBeforeCreate, "edit", o.EditBeforeCreate, "Edit the API resource before creating")
	cmd.Flags().Bool("windows-line-endings", runtime.GOOS == "windows",
		"Only relevant if --edit=true. Defaults to the line ending native to your platform.")
	cmdutil.AddApplyAnnotationFlags(cmd)
	cmdutil.AddDryRunFlag(cmd)
	cmd.Flags().StringVarP(&o.Selector, "selector", "l", o.Selector, "Selector (label query) to filter on, supports '=', '==', and '!='.(e.g. -l key1=value1,key2=value2)")
	cmd.Flags().StringVar(&o.Raw, "raw", o.Raw, "Raw URI to POST to the server.  Uses the transport specified by the kubeconfig file.")
	cmdutil.AddFieldManagerFlagVar(cmd, &o.fieldManager, "kubectl-create")

	o.PrintFlags.AddFlags(cmd)

	// create的子命令，指定create对象
	cmd.AddCommand(NewCmdCreateNamespace(f, ioStreams))
	cmd.AddCommand(NewCmdCreateQuota(f, ioStreams))
	cmd.AddCommand(NewCmdCreateSecret(f, ioStreams))
	cmd.AddCommand(NewCmdCreateConfigMap(f, ioStreams))
	cmd.AddCommand(NewCmdCreateServiceAccount(f, ioStreams))
	cmd.AddCommand(NewCmdCreateService(f, ioStreams))
	cmd.AddCommand(NewCmdCreateDeployment(f, ioStreams))
	cmd.AddCommand(NewCmdCreateClusterRole(f, ioStreams))
	cmd.AddCommand(NewCmdCreateClusterRoleBinding(f, ioStreams))
	cmd.AddCommand(NewCmdCreateRole(f, ioStreams))
	cmd.AddCommand(NewCmdCreateRoleBinding(f, ioStreams))
	cmd.AddCommand(NewCmdCreatePodDisruptionBudget(f, ioStreams))
	cmd.AddCommand(NewCmdCreatePriorityClass(f, ioStreams))
	cmd.AddCommand(NewCmdCreateJob(f, ioStreams))
	cmd.AddCommand(NewCmdCreateCronJob(f, ioStreams))
	return cmd
}

```

## RunCreate

```go
func (o *CreateOptions) RunCreate(f cmdutil.Factory, cmd *cobra.Command) error {
	// f为传入的Factory，主要是封装了与kube-apiserver交互客户端
  
	schema, err := f.Validator(cmdutil.GetFlagBool(cmd, "validate"))
	if err != nil {
		return err
	}

	cmdNamespace, enforceNamespace, err := f.ToRawKubeConfigLoader().Namespace()
	if err != nil {
		return err
	}

  // 实例化Builder，这块的逻辑比较复杂，我们先关注文件部分 这些大部分是给builder设置参数，在Do的时候执行逻辑，返回我们想要的Result
	r := f.NewBuilder().
		Unstructured().
		Schema(schema).
		ContinueOnError().
		NamespaceParam(cmdNamespace).DefaultNamespace().
  	// 读取文件信息，发现除了支持简单的本地文件，也支持标准输入和http/https协议访问的文件，保存为Visitor 
		FilenameParam(enforceNamespace, &o.FilenameOptions).
		LabelSelectorParam(o.Selector).
		Flatten().
		Do()
	err = r.Err()
	if err != nil {
		return err
	}

	count := 0
  // 调用visit函数，创建资源
	err = r.Visit(func(info *resource.Info, err error) error {
		// 我们看到的pod创建成功就是在这里打印的 打印结果 xxxx created 
		return o.PrintObj(info.Object)
	})
	return nil
}

```

**站在前人的肩膀上，向前辈致敬，Respect！**

## Summary

1. 我们从一个创建pod的过程开始，在`cmd/kubectl`中找到kubectl的启动过程，kubernetes的命令行工具了利用`spf13/cobra`库，传入并解析参数，去匹配子命令，配置kubectl的默认参数。
2. 在`NewKubectlCommand`中进行初始化，有初始化前后的钩子和七类命令，还实现了`Factory`，在命令中进入Create，进行验证参数并运行，把文件名配置到CreateOptions中，进入`RunCreate`，其中传入的Factory，封装了与`kube-apiserver交互的客户端`。
3. 根据配置实例化`Builder`，该函数调用了NewBuilder、Schema等一系列函数，这段代码所做的事情是将命令行接收到的参数转化为一个资源的列。`它使用了Builder模式的变种`，使用独立的函数做各自的数据初始化工作。函数Schema、ContinueOnError、NamespaceParam、DefaultNamespace、FilenameParam、SelectorParam和Flatten都引入了一个指向Builder结构的指针，`执行一些对它的修改，并且将这个结构体返回给调用链中的下一个方法来执行这些修改。`
4. FilenameParam里面就进行了解析文件，除了支持简单的本地文件，也支持标准输入和http/https协议访问的文件，保存为`Visitor`，再调用`Visit`返回结果，`下一节将介绍Visitor访问者模式是和发请求创建pod的细节是怎么实现的。`


