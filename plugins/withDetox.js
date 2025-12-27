const {
  withProjectBuildGradle,
  withAppBuildGradle,
  withDangerousMod,
  withAndroidManifest,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Detox Android Setup
 * Automatically configures all required Detox settings during expo prebuild
 */

// Add Detox maven repository to android/build.gradle
function withDetoxMavenRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if Detox repo already exists
    if (buildGradle.includes('detox/Detox-android')) {
      return config;
    }

    // Add Detox maven repository in allprojects.repositories
    const mavenRepo = `        // Detox repository
        maven { url "$rootDir/../node_modules/detox/Detox-android" }`;

    // Find the allprojects { repositories { block and add the maven repo
    const allProjectsRegex = /(allprojects\s*\{\s*repositories\s*\{)/;
    if (allProjectsRegex.test(buildGradle)) {
      config.modResults.contents = buildGradle.replace(
        allProjectsRegex,
        `$1\n${mavenRepo}`
      );
    } else {
      // If allprojects block doesn't exist, add it before the last closing brace
      const allProjectsBlock = `
allprojects {
    repositories {
${mavenRepo}
    }
}
`;
      // Find a good place to insert - after buildscript block or at the end
      const buildscriptEndRegex = /(buildscript\s*\{[\s\S]*?\n\})/;
      if (buildscriptEndRegex.test(buildGradle)) {
        config.modResults.contents = buildGradle.replace(
          buildscriptEndRegex,
          `$1\n${allProjectsBlock}`
        );
      } else {
        config.modResults.contents = buildGradle + allProjectsBlock;
      }
    }

    return config;
  });
}

// Add Detox test configuration and dependencies to android/app/build.gradle
function withDetoxAppBuildGradle(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Add testBuildType and testInstrumentationRunner in defaultConfig
    if (!buildGradle.includes('testInstrumentationRunner')) {
      const defaultConfigRegex = /(defaultConfig\s*\{[^}]*)(versionName[^\n]*)/;
      const testConfig = `$1$2

        // Detox test instrumentation
        testBuildType System.getProperty('testBuildType', 'debug')
        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`;

      buildGradle = buildGradle.replace(defaultConfigRegex, testConfig);
    }

    // Add Detox dependencies
    if (!buildGradle.includes("com.wix:detox")) {
      const dependenciesRegex = /(dependencies\s*\{)/;
      const detoxDependencies = `$1
    // Detox testing dependencies
    androidTestImplementation('com.wix:detox:+')
    androidTestImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test:runner:1.5.2'
    androidTestImplementation 'androidx.test:rules:1.5.0'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
`;
      buildGradle = buildGradle.replace(dependenciesRegex, detoxDependencies);
    }

    config.modResults.contents = buildGradle;
    return config;
  });
}

// Create DetoxTest.java file
function withDetoxTestFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.app';
      const packagePath = packageName.replace(/\./g, '/');
      const projectRoot = config.modRequest.projectRoot;

      const androidTestDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'androidTest',
        'java',
        ...packagePath.split('/')
      );

      // Create directory if it doesn't exist
      fs.mkdirSync(androidTestDir, { recursive: true });

      const detoxTestContent = `package ${packageName};

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (${packageName}.BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;

      const detoxTestPath = path.join(androidTestDir, 'DetoxTest.java');
      fs.writeFileSync(detoxTestPath, detoxTestContent);

      return config;
    },
  ]);
}

// Create network_security_config.xml for localhost communication
function withNetworkSecurityConfig(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create directory if it doesn't exist
      fs.mkdirSync(xmlDir, { recursive: true });

      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;

      const configPath = path.join(xmlDir, 'network_security_config.xml');
      fs.writeFileSync(configPath, networkSecurityConfig);

      return config;
    },
  ]);
}

// Add network security config reference to AndroidManifest.xml
function withNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add networkSecurityConfig to application
    if (manifest.application && manifest.application.length > 0) {
      const app = manifest.application[0];
      if (!app.$['android:networkSecurityConfig']) {
        app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      }
    }

    return config;
  });
}

// Main plugin function that combines all modifications
function withDetox(config) {
  config = withDetoxMavenRepo(config);
  config = withDetoxAppBuildGradle(config);
  config = withDetoxTestFile(config);
  config = withNetworkSecurityConfig(config);
  config = withNetworkSecurityManifest(config);
  return config;
}

module.exports = withDetox;
