---
title: "Android Url的一些常见处理"
publishdate: 2024-03-19
authors: 
  name: "没有了遇见"
  title: "那些杀不死我的，终将使我强大。自己才是现状的帮凶！！！"
  url: "https://www.jianshu.com/u/6e3c572ab339"
  image_url: "None"
tags: []
summary: >-
  Your summary here
---
 日常开发的时候,会遇到各种各样的Url.这里就总结一些常见的Url遇到的一些问题,以及对应的处理方式 

##  常见问题 

  * 参数问题 
  * 重定向问题 
  * Url长度问题 
  * Url传递过程中编码问题 



####  1.Url 参数处理 

1.1 获取Url 指定参数的值 

_ _
    
    
    ```kotlin
     /**
         * 获取Url的原来参数值
         */
        fun getQueryParameterValue(url: String, key: String): String? {
    
            if (TextUtils.isEmpty(url) || TextUtils.isEmpty(key)) return url
            var uri = Uri.parse(url)
            if (uri.isOpaque()) {
                return url
            }
            //利用Map的唯一性拼接参数
            var parameterMap = getParameterMap(url)
            return parameterMap.get(key)
    
        }
    
        /**
         *  获取Url参数的值(Decode之后的)
         *
         *  getQueryParameter()  方法是默认Decode的
         *
         */
        fun getQueryParameterDecodeValue(url: String, key: String): String? {
            if (TextUtils.isEmpty(url) || TextUtils.isEmpty(key)) return ""
            var uri = Uri.parse(url)
            if (uri.isOpaque()) {
                return ""
            } else {
                return Uri.parse(url).getQueryParameter(key)
            }
        }
    
      /**
         * 把url 的参数转为Map存储
         */
        private fun getParameterMap(
            url: String
        ): HashMap {
            var map: HashMap = HashMap()
            // 参数名字的列表
            var parameter = Uri.parse(url).queryParameterNames
            parameter.forEach {
                if (getQueryParameterDecodeValue(url, it) != null)
                    map.put(it, getQueryParameterDecodeValue(url, it)!!)
            }
            return map
        }
    
    
    
    ```

1.2 添加和删除指定参数 

_ _
    
    
    ```kotlin
    
    /**
         * 删除Encode 的参数
         */
        fun deleteQueryParameterDecodeValue(url: String, key: String): String {
            if (TextUtils.isEmpty(url) || TextUtils.isEmpty(key)) return url
            var uri = Uri.parse(url)
            if (uri.isOpaque()) {
                return url
            }
            if (!url.contains("?")) {
                url + "?"
            }
            var urlStart = url.split("?").get(0)
            //利用Map的唯一性拼接参数
            var parameterMap = getParameterMap(url)
            //利用map的唯一性 存储或者更新值
            if (parameterMap.containsKey(key)){
                parameterMap.remove(key)
            }
            //参数的map
            var appendUrl = appendMapParameter(parameterMap)
            var division = "?"
            return "$urlStart$division$appendUrl"
        }
    
       /**
         * 添加 Encode 的参数
         */
        fun addQueryParameterDecodeValue(url: String, key: String, value: String): String {
            if (TextUtils.isEmpty(url) || TextUtils.isEmpty(key)) return url
            var uri = Uri.parse(url)
            if (uri.isOpaque()) {
                return url
            }
            if (!url.contains("?")) {
                url + "?"
            }
            var urlStart = url.split("?").get(0)
            //利用Map的唯一性拼接参数
            var parameterMap = getParameterMap(url)
            //利用map的唯一性 存储或者更新值
            parameterMap.put(key, Uri.encode(value))
            //参数的map
            var appendUrl = appendMapParameter(parameterMap)
            var division = "?"
            return "$urlStart$division$appendUrl"
        }
    
     /**
         * url 添加参数
         */
        fun addQueryParameterValue(url: String, key: String, value: String): String {
            if (TextUtils.isEmpty(url) || TextUtils.isEmpty(key)) return url
            var uri = Uri.parse(url)
            if (uri.isOpaque()) {
                return url
            }
    
            if (url.contains("#")) {
                url.replace("#", "%23")
            }
            if (!url.contains("?")) {
                url + "?"
            }
            var urlStart = url.split("?").get(0)
            //利用Map的唯一性拼接参数
            var parameterMap = getParameterMap(url)
            //利用map的唯一性 存储或者更新值
            parameterMap.put(key, value)
            //参数的map
            var appendUrl = appendMapParameter(parameterMap)
            var division = "?"
            return "$urlStart$division$appendUrl"
        }
    
    
    /**
         * map 拼接成字符串
         */
        private fun appendMapParameter(parameterMap: HashMap): String {
            var stringBuilder = StringBuilder()
    
            parameterMap.keys.forEach {
                stringBuilder.append(it).append("=").append(parameterMap.get(it)).append("&")
            }
            if (stringBuilder.length > 0) {
                stringBuilder.deleteCharAt(stringBuilder.length - 1)
            }
            return stringBuilder.toString()
        }
    
        /**
         * 把url 的参数转为Map存储
         */
        private fun getParameterMap(
            url: String
        ): HashMap {
            var map: HashMap = HashMap()
            // 参数名字的列表
            var parameter = Uri.parse(url).queryParameterNames
            parameter.forEach {
                if (getQueryParameterDecodeValue(url, it) != null)
                    map.put(it, getQueryParameterDecodeValue(url, it)!!)
            }
            return map
        }
    
    
    ```

####  2.获取重定向地址的真实地址 

_ _
    
    
    ```tsx
    package com.wu.base.util;
    
    import android.text.TextUtils;
    
    import java.io.IOException;
    import java.net.HttpURLConnection;
    import java.net.URLDecoder;
    import java.net.URLEncoder;
    import java.util.concurrent.TimeUnit;
    
    import io.reactivex.Observable;
    import io.reactivex.ObservableOnSubscribe;
    import io.reactivex.ObservableSource;
    import io.reactivex.Observer;
    import io.reactivex.android.schedulers.AndroidSchedulers;
    import io.reactivex.disposables.Disposable;
    import io.reactivex.functions.Function;
    import io.reactivex.schedulers.Schedulers;
    import okhttp3.Call;
    import okhttp3.Callback;
    import okhttp3.OkHttpClient;
    import okhttp3.Request;
    import okhttp3.Response;
    
    /**
     * @author wkq
     * @date 2022年07月22日 16:15
     * @des 重定向Url处理工具
     */
    
    public class UrlRedirectUrlUtil {
        //是否Encode
        private static boolean isEncode = false;
        private static Disposable callDisposable;
    
    
        //获取重定向后的真实地址
        public static String getRedirectUrl(String path) {
    
            boolean isEncode = false;
            if (TextUtils.isEmpty(path)) {
                return "";
            }
            if (findEnd(path)) {
                return path;
            }
            if (isShortUrl(path))
                return path;
            try {
                if (path.contains("#")) {
                    path = path.replace("#", URLEncoder.encode("#"));
                    isEncode = true;
                }
                OkHttpClient mOkHttpClient = new OkHttpClient();
                Request request = new Request.Builder()
                        .addHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8")
                        .addHeader("Accept-Encoding", "gzip, deflate, br")
                        .addHeader("Accept-Language", "zh-CN,zh;q=0.9")
                        .addHeader("Connection", "keep-alive")
                        .addHeader("User-Agent", "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Mobile Safari/537.36")
                        .url(path)
                        .build();
                Call mCall = mOkHttpClient.newCall(request);
                Response response = mCall.execute();
                String backUrl = response.header("Location");
                if (response.code() != HttpURLConnection.HTTP_MOVED_TEMP && response.code() != HttpURLConnection.HTTP_MOVED_PERM) {
                    String requestPath = response.request().url().toString();
                    if (isEncode) {
                        requestPath = requestPath.replace("%23", URLDecoder.decode("%23"));
                        isEncode = false;
                    }
                    return requestPath;
                } else {
                    return getRedirectUrl(backUrl);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return path;
            }
        }
    
    
        //处理重定向的Url
        public static void getRedirectUrl(String url, ResponseCallBack callBack) {
            if (callBack == null) return;
            //取消上一个请求
            cancelRequest();
            if (TextUtils.isEmpty(url)) {
                callBack.getRedirectFail();
                return;
            }
            if (findEnd(url)) {
                callBack.getRedirectSuccess(url);
                return;
            }
            if (isShortUrl(url)) {
                callBack.getRedirectSuccess(url);
                return;
            }
    
    
            callDisposable = Observable
                    .create((ObservableOnSubscribe) emitter -> {
                        if (url.contains("#")) {
                            isEncode = true;
                            emitter.onNext(url.replace("#", URLEncoder.encode("#")));
                        } else {
                            emitter.onNext(url);
                        }
                        emitter.onComplete();
                    })
                    .flatMap((Function>) s -> new Observable() {
                        @Override
                        protected void subscribeActual(Observer observer) {
                            Request.Builder builder = new Request.Builder();
                            builder.header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
                            builder.header("Accept-Encoding", "gzip, deflate, br");
                            builder.header("Accept-Language", "zh-CN,zh;q=0.9");
                            builder.header("Connection", "keep-alive");
                            builder.header("User-Agent", "Mozilla/5.0 (Linux; Android 5.0; AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Mobile Safari/537.36");
                            Request request = builder.url(s).get().build();
    
                            OkHttpClient client = new OkHttpClient()
                                    .newBuilder()
                                    .followRedirects(false)
                                    .connectTimeout(10, TimeUnit.SECONDS)//设置连接超时时间
                                    .writeTimeout(10, TimeUnit.SECONDS)
                                    .readTimeout(10, TimeUnit.SECONDS)//设置读取超时时间
                                    .build();
                            client.writeTimeoutMillis();
                            client.newCall(request).enqueue(new Callback() {
                                @Override
                                public void onFailure(Call call, IOException e) {
                                    observer.onError(new Throwable("解析失败"));
                                }
    
                                @Override
                                public void onResponse(Call call, Response response) throws IOException {
                                    String path = url;
    
                                    if (response.code() == HttpURLConnection.HTTP_MOVED_TEMP || response.code() == HttpURLConnection.HTTP_MOVED_PERM) {
                                        String location = response.headers().get("Location");
                                        if (!TextUtils.isEmpty(location)) {
                                            path = location;
                                        }
                                        if (isEncode) {
                                            path = path.replace("%23", URLDecoder.decode("%23"));
                                            isEncode = false;
                                        }
                                    }
                                    observer.onNext(path);
                                    observer.onComplete();
                                }
                            });
                        }
                    })
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(
                            path -> callBack.getRedirectSuccess(path),
                            throwable -> callBack.getRedirectFail());
    
        }
    
        //    取消请求
        public static void cancelRequest() {
            if (callDisposable != null && !callDisposable.isDisposed()) {
                callDisposable.dispose();
            }
        }
    
        /**
         * 判断是否是是讯云短连接
         *
         * @param url
         * @return
         */
        public static boolean isShortUrl(String url) {
    
            return false;
    
        }
    
        /**
         * 判断外部链接.MP4结尾
         */
        public static boolean findEnd(String url) {
            if (url.endsWith(".mp4")) {
                return true;
            }
            return false;
        }
    
    
        public interface ResponseCallBack {
            void getRedirectSuccess(String url);
    
            void getRedirectFail();
        }
    
    }
    
    
    
    ```

####  3.处理地址过长问题 

日常开发的时候有一些三方SDK对Url的长度做出了限制,再加上日常使用过程中Url贼长让需要对Url做操作的同事极度反感,这个时候就需要对很长的Url做处理,以下是个人对长连接做的处理 

  * 缩短器:后台来个长变短的服务,其实也就是一个字符串变短的算法,移动端请求接口即可 
  * 对Url的参数进行编码使参数变短 



####  4.Url参数编码问题 

Url在分享,浏览器打开的时候中文或者特殊字符会影响Url的使用,所以在给Url处理参数的时候,给参数做统一编码(Encode)显得特别重要.假如是复杂和长期维护的项目,建议项目架构的时候就处理掉这个问题,不然后期会疯(亲身经历). 

##  总结 

日常开发中,会遇到各种各样的Url,所以涉及到的Url处理也就各种各样,建议将Url做一个统一进出的工具 统一管理各种Url的操作.其中涉及到的Url参数转码问题要慎重,要提前和H5和IOS沟通好防止出现Url处理不同意问题. 

:::tip 版权说明
本文由程序自动从互联网获取，如有侵权请联系删除，版权属于原作者。

作者：没有了遇见

链接：https://www.jianshu.com/p/240714b04875
::: 
