pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "everything-local-native"

include(":customer:app")
include(":merchant:app")
include(":delivery-partner:app")
include(":wholesaler:app")
include(":core:common")
include(":core:models")
include(":core:network")
include(":core:database")
include(":core:authentication")
include(":core:designsystem")
