/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect} from 'react';
import Translate from '@docusaurus/Translate';
import GitHubButton from 'react-github-btn';

import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';

import CrossPlatformSVG from '../../static/img/homepage/cross-platform.svg';
import {setupDissectionAnimation} from './animations/_dissectionAnimation';
import {setupHeaderAnimations} from './animations/_headerAnimation';

const textContent = {
  intro: `
React Native combines the best parts of native development with React,
a best-in-class JavaScript library for building user interfaces.
<br/><br/>
<strong>Use a little—or a lot</strong>. You can use React Native today in your existing
Android and iOS projects or you can create a whole new app from scratch.
  `,
  nativeCode: `
React primitives render to native platform UI, meaning your app uses the
same native platform APIs other apps do.
<br/><br/>
<strong>Many platforms</strong>, one React. Create platform-specific versions of components
so a single codebase can share code across platforms. With React Native,
one team can maintain multiple platforms and share a common technology—React.
  `,
  codeExample: `
import React from 'react';
import {Text, View} from 'react-native';
import {Header} from './Header';
import {heading} from './Typography';

const WelcomeScreen = () => (
  <View>
    <Header title="Welcome to React Native"/>
    <Text style={heading}>Step One</Text>
    <Text>
      Edit App.js to change this screen and turn it
      into your app.
    </Text>
    <Text style={heading}>See Your Changes</Text>
    <Text>
      Press Cmd + R inside the simulator to reload
      your app’s code.
    </Text>
    <Text style={heading}>Debug</Text>
    <Text>
      Press Cmd + M or Shake your device to open the
      React Native Debug Menu.
    </Text>
    <Text style={heading}>Learn</Text>
    <Text>
      Read the docs to discover what to do next:
    </Text>
   </View>
);
  `,
  forEveryone: `
  AI工具通过模拟人类智能过程，能够处理复杂的数据分析、预测和决策任务，从而在多个领域带来显著的便利和效率提升。以下是一些具体的应用场景：<br>
    工作效率提升<br>
    数据分析与决策支持<br>
    个性化服务<br>
    推荐系统<br>
    个性化广告<br>
    创新应用<br>
    教育与学习<br>
  AI工具的发展正在不断打破传统的工作和生活方式，通过智能化的服务和解决方案，为人们带来更多的便利和可能性。随着技术的进步，未来AI在更多领域的应用将会更加广泛和深入。
  `,
  crossPlatform: `
React components wrap existing native code and interact with native APIs via
React’s declarative UI paradigm and JavaScript. This enables native app development
for whole new teams of developers, and can let existing native teams work much faster.
  `,
  fastRefresh: `
<strong>See your changes as soon as you save.</strong> With the power of JavaScript,
React Native lets you iterate at lightning speed. No more waiting for native builds to finish.
Save, see, repeat.
  `,
  talks: `
Members of the React Native team frequently speak at various conferences.
<br/><br/>
You can follow the latest news from the React Native team on Twitter
  `,
};

function Heading({text}) {
  return <h2 className="Heading">{text}</h2>;
}

function ActionButton({href, type = 'primary', target, children}) {
  return (
    <a className={`ActionButton ${type}`} href={href} target={target}>
      {children}
    </a>
  );
}

function TextColumn({title, text, moreContent}) {
  return (
    <>
      <Heading text={title} />
      <div dangerouslySetInnerHTML={{__html: text}} />
      {moreContent}
    </>
  );
}

function HomeCallToAction() {
  return (
    <>
      <ActionButton
        type="primary"
        href={useBaseUrl('docs/environment-setup')}
        target="_self">
        Get started
      </ActionButton>
      <ActionButton
        type="secondary"
        href={useBaseUrl('docs/getting-started')}
        target="_self">
        Learn the basics
      </ActionButton>
    </>
  );
}

function TwitterButton({accountName}) {
  return (
    <a
      href={`https://twitter.com/intent/follow?screen_name=${accountName}&region=follow_link`}
      className="twitter-follow-button">
      <div className="icon" />
      Follow @{accountName}
    </a>
  );
}

function GitHubStarButton() {
  return (
    <div className="github-button">
      <GitHubButton
        href="https://github.com/facebook/react-native"
        data-icon="octicon-star"
        data-size="large"
        aria-label="Star facebook/react-native on GitHub">
        Star
      </GitHubButton>
    </div>
  );
}

export function Section({
  element = 'section',
  children,
  className,
  background = 'light',
}) {
  const El = element;
  return (
    <El
      className={
        className
          ? `Section ${className} ${background}`
          : `Section ${background}`
      }>
      {children}
    </El>
  );
}

function TwoColumns({columnOne, columnTwo, reverse}) {
  return (
    <div className={`TwoColumns ${reverse ? 'reverse' : ''}`}>
      <div className={`column first ${reverse ? 'right' : 'left'}`}>
        {columnOne}
      </div>
      <div className={`column last ${reverse ? 'left' : 'right'}`}>
        {columnTwo}
      </div>
    </div>
  );
}

function ScreenRect({className, fill, stroke}) {
  return (
    <rect
      className={`screen ${className || ''}`}
      rx="3%"
      width="180"
      height="300"
      x="-90"
      y="-150"
      fill={fill}
      stroke={stroke}
    />
  );
}

function LogoAnimation() {
  return (
    <svg
      className="LogoAnimation init"
      width={350}
      height={350}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-200 -200 400 400">
      <title>React Logo</title>
      <clipPath id="screen">
        <ScreenRect fill="none" stroke="gray" />
      </clipPath>
      <rect
        x="-25"
        y="120"
        width="50"
        height="25"
        rx="2"
        fill="white"
        stroke="none"
        className="stand"
      />
      <polygon
        points="-125,90 125,90 160,145 -160,145"
        fill="white"
        stroke="white"
        strokeWidth="5"
        strokeLinejoin="round"
        className="base"
      />
      <ScreenRect className="background" stroke="none" />
      <g clipPath="url(#screen)" className="logo">
        <g className="logoInner">
          <circle cx="0" cy="0" r="30" fill="#61dafb" />
          <g stroke="#61dafb" strokeWidth="15" fill="none" id="logo">
            <ellipse rx="165" ry="64" />
            <ellipse rx="165" ry="64" transform="rotate(60)" />
            <ellipse rx="165" ry="64" transform="rotate(120)" />
          </g>
        </g>
        <line
          x1="-30"
          x2="30"
          y1="130"
          y2="130"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          className="speaker"
        />
      </g>
      <ScreenRect fill="none" stroke="white" />
    </svg>
  );
}

function HeaderHero() {
  return (
    <Section background="dark" className="HeaderHero">
      <div className="socialLinks">
        <TwitterButton accountName="reactnative" />
        <GitHubStarButton />
      </div>
      <TwoColumns
        reverse
        columnOne={<LogoAnimation />}
        columnTwo={
          <>
            <h1 className="title">和光科技</h1>
            <p className="tagline">智慧方便生活.</p>
            <div className="buttons">
              <HomeCallToAction />
            </div>
          </>
        }
      />
    </Section>
  );
}

function NativeApps() {
  return (
    <Section className="NativeApps" background="light">
      <TwoColumns
        reverse
        columnOne={
          <TextColumn
            title="Create native apps for Android, iOS, and more using React"
            text={textContent.intro}
          />
        }
        columnTwo={<img alt="" src={useBaseUrl('img/homepage/phones.png')} />}
      />
    </Section>
  );
}

function NativeCode() {
  return (
    <Section className="NativeCode" background="tint">
      <TwoColumns
        columnOne={
          <TextColumn
            title="Written in JavaScript—rendered with native code"
            text={textContent.nativeCode}
          />
        }
        columnTwo={
          <CodeBlock language="jsx">{textContent.codeExample}</CodeBlock>
        }
      />
    </Section>
  );
}

function NativeDevelopment() {
  return (
    <Section className="NativeDevelopment" background="light">
      <TwoColumns
        reverse
        columnOne={
          <TextColumn title="小巧的AI工具" text={textContent.forEveryone} />
        }
        columnTwo={
          <div className="dissection">
            {[0, 1, 2, 3].map(i => (
              <img
                alt=""
                key={i}
                src={useBaseUrl(`img/homepage/dissection/${i}.png`)}
              />
            ))}
          </div>
        }
      />
    </Section>
  );
}

function CrossPlatform() {
  return (
    <Section className="CrossPlatform" background="tint">
      <TwoColumns
        columnOne={
          <TextColumn
            title="Seamless Cross-Platform"
            text={textContent.crossPlatform}
          />
        }
        columnTwo={<CrossPlatformSVG />}
      />
    </Section>
  );
}

function FastRefresh() {
  return (
    <Section className="FastRefresh" background="light">
      <TwoColumns
        reverse
        columnOne={
          <TextColumn title="Fast Refresh" text={textContent.fastRefresh} />
        }
        columnTwo={
          <video
            muted
            autoPlay
            loop
            playsInline
            src={useBaseUrl(`img/homepage/ReactRefresh.mp4`)}
          />
        }
      />
    </Section>
  );
}

function VideoContent() {
  return (
    <div>
      <Section className="VideoContent" background="tint">
        <br />
        <TwoColumns
          columnOne={
            <TextColumn
              title="Talks and Videos"
              text={textContent.talks}
              moreContent={<TwitterButton accountName="reactnative" />}
            />
          }
          columnTwo={
            <div className="vidWrapper">
              <iframe
                src="https://www.youtube.com/embed/NCAY0HIfrwc"
                title="Mobile Innovation with React Native, ComponentKit, and Litho"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          }
        />
        <br />
        <TwoColumns
          columnOne={
            <>
              <p>
                The{' '}
                <a href="https://opensource.facebook.com/">
                  Meta Open Source team
                </a>{' '}
                has put together a short overview of React Native, where they
                explained the project in beginner's terms.
              </p>
            </>
          }
          columnTwo={
            <div className="vidWrapper">
              <iframe
                src="https://www.youtube.com/embed/wUDeLT6WXnQ"
                title="Explain Like I'm 5: React Native"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          }
        />
      </Section>
    </div>
  );
}

/* Community */

function AppList() {
  const {siteConfig} = useDocusaurusContext();
  const apps = Object.values(siteConfig.customFields.users)
    .flat()
    .filter(app => app.pinned);

  return (
    <ul className="AppList">
      {apps.map((app, i) => {
        const imgSource = !app.icon.startsWith('http')
          ? useBaseUrl('img/showcase/' + app.icon)
          : app.icon;
        return (
          <li key={i} className="item">
            {app.infoLink ? (
              <a href={app.infoLink}>
                <img src={imgSource} alt={app.name} />
              </a>
            ) : (
              <img src={imgSource} alt={app.name} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Community() {
  return (
    <Section className="Community" background="light">
      <div className="content">
        <Heading text="人工智能" />
        <TwoColumns
          columnOne={
            <>
              <p className="firstP">
                <img src={useBaseUrl(`img/homepage/fb-logo.svg`)} alt="" />
                <span>OpenAI.</span>
              </p>
              <p>
                In 2018, React Native had the{' '}
                <a href="https://octoverse.github.com/2018/projects#repositories">
                  2nd highest
                </a>{' '}
                number of contributors for any repository in GitHub. Today,
                React Native is supported by contributions from individuals and
                companies around the world including{' '}
                <span>
                  <a href="https://callstack.com/">Callstack</a>
                </span>
                ,{' '}
                <span>
                  <a href="https://expo.io/">Expo</a>
                </span>
                , <a href="https://infinite.red/">Infinite Red</a>,{' '}
                <a href="https://www.microsoft.com/">Microsoft</a> and{' '}
                <a href="https://swmansion.com/">Software Mansion</a>.
              </p>
              <p>
                Our community is always shipping exciting new projects and
                exploring platforms beyond Android and iOS with repos like{' '}
                <span>
                  <a href="https://github.com/microsoft/react-native-windows#readme">
                    React Native Windows
                  </a>
                </span>
                ,{' '}
                <a href="https://github.com/microsoft/react-native-macos#readme">
                  React Native macOS
                </a>{' '}
                and{' '}
                <a href="https://github.com/necolas/react-native-web#readme">
                  React Native Web
                </a>
                .
              </p>
            </>
          }
          columnTwo={
            <>
              <p>人工智能大模型:</p>
              <AppList />
              <p>
                and <a href={useBaseUrl(`showcase`)}>many more</a>.
              </p>
            </>
          }
        />
      </div>
    </Section>
  );
}

function GetStarted() {
  return (
    <Section className="GetStarted" background="dark">
      <div className="content">
        <Heading text="Give it a try" />
        <ol className="steps">
          <li>
            <p>Run this</p>
            <div className="terminal">
              <code>npx react-native init MyTestApp</code>
            </div>
          </li>
          <li>
            <p>Read these</p>
            <HomeCallToAction />
          </li>
        </ol>
      </div>
    </Section>
  );
}

const useHomePageAnimations = () => {
  useEffect(() => setupHeaderAnimations(), []);
  useEffect(() => setupDissectionAnimation(), []);
};

const Index = () => {
  useHomePageAnimations();
  return (
    <Layout
      description="A framework for building native apps using React"
      wrapperClassName="homepage">
      <Head>
        <title>和光科技，AI增强生活</title>
        <meta property="og:title" content="和光科技，AI增强生活" />
        <meta property="twitter:title" content="和光科技，AI增强生活" />
      </Head>
      <NativeDevelopment />
      <Community />
    </Layout>
  );
};

export default Index;
