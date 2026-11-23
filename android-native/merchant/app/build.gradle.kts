import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val keystorePropsFile = rootProject.file("keystore/keystore.properties")
val keystoreProps = Properties()
if (keystorePropsFile.exists()) {
    keystoreProps.load(FileInputStream(keystorePropsFile))
}

android {
    namespace = "com.ayushp0021.everythinglocal.merchant"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ayushp0021.everythinglocal.merchant"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            val keyStoreFile = rootProject.file(
                keystoreProps.getProperty("storeFile") ?: "keystore/everythinglocal-release.jks"
            )
            if (keyStoreFile.exists()) {
                storeFile = keyStoreFile
                storePassword = keystoreProps.getProperty("storePassword") ?: System.getenv("EL_KEYSTORE_PASSWORD") ?: "EverythingLocal@2026"
                keyAlias = keystoreProps.getProperty("keyAlias") ?: System.getenv("EL_KEY_ALIAS") ?: "everythinglocal"
                keyPassword = keystoreProps.getProperty("keyPassword") ?: System.getenv("EL_KEY_PASSWORD") ?: "EverythingLocal@2026"
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ""
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:4000/api/\"")
            buildConfigField("String", "ENVIRONMENT", "\"DEBUG\"")
            buildConfigField("Boolean", "IS_DEBUG_NETWORK", "true")
        }
        create("staging") {
            initWith(getByName("debug"))
            matchingFallbacks += listOf("debug")
            buildConfigField("String", "API_BASE_URL", "\"https://staging-api.everythinglocal.in/api/\"")
            buildConfigField("String", "ENVIRONMENT", "\"STAGING\"")
            buildConfigField("Boolean", "IS_DEBUG_NETWORK", "false")
            signingConfig = signingConfigs.getByName("release")
        }
        release {
            isMinifyEnabled = false
            buildConfigField("String", "API_BASE_URL", "\"https://api.everythinglocal.in/api/\"")
            buildConfigField("String", "ENVIRONMENT", "\"RELEASE\"")
            buildConfigField("Boolean", "IS_DEBUG_NETWORK", "false")
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api"
        )
    }
}

dependencies {
    implementation(project(":core:common"))
    implementation(project(":core:models"))
    implementation(project(":core:network"))
    implementation(project(":core:authentication"))
    implementation(project(":core:designsystem"))

    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.navigation:navigation-compose:2.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.5")

    // CameraX and ML Kit Barcode Scanner
    implementation("androidx.camera:camera-core:1.3.4")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")

    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
