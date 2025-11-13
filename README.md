# Raindrop Sync for Chrome

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![codecov](https://codecov.io/gh/lasuillard-s/raindrop-sync-chrome/graph/badge.svg?token=52rvoFBAEb)](https://codecov.io/gh/lasuillard-s/raindrop-sync-chrome)
![GitHub Release](https://img.shields.io/github/v/release/lasuillard-s/raindrop-sync-chrome)

Chrome browser extension for syncing bookmarks with Raindrop.

## ✨ Features

Core features supported:

- [x] One-way sync from Raindrop.io to Chrome Bookmarks

- [x] Background sync on startup and periodically

Planned features:

- [ ] Granular synchronization: map query results and collections to specific bookmark folders

- [ ] Two-way sync between Raindrop.io and Chrome Bookmarks

- [ ] Publish the extension to the Chrome Web Store

- [ ] Support for additional browsers

## 🚀 Getting Started

> ❗ **Caution:** This project is currently under development. Many features may be incomplete or buggy.

### 📦 Installing the Extension Locally

The extension is not yet published to the Chrome Web Store. Follow the steps below to install it locally. Once the core features are implemented and stabilized, we will publish the extension to the Chrome Web Store.

1. **Download the Extension Archive**

    Download the `.zip` file from the [releases page](https://github.com/lasuillard-s/raindrop-sync-chrome/releases).

2. **Unzip the Archive**

    Extract the contents of the downloaded archive to your desired location, then open the Chrome browser.

3. **Access Chrome Extensions**

    Navigate to `chrome://extensions` in your Chrome browser.

4. **Enable Developer Mode**

    Toggle **Developer Mode** on at the top-right corner of the page.

    ![Chrome Manage Extensions Page](/docs/images/chrome-manage-extensions.png)

5. **Load the Unpacked Extension**

    Click the **Load Unpacked** button and select the directory where you unzipped the extension.

    ![Chrome Load Unpacked Extension](/docs/images/chrome-load-unpacked-extension.png)

6. **Verify Installation**

    You should now see the extension listed among your installed extensions.

    ![Chrome Extension Installed](/docs/images/chrome-extension-installed.png)

7. **Start Using the Extension**

    The extension is now available for use.

> ‼️ **Warning:** This project is in the early stages of development. Many features are incomplete or buggy, and there is a risk of breaking your bookmarks due to poor implementation. We strongly recommend backing up your bookmarks before using this extension.

### 👟 Initializing the Application

1. **Visit the Options Page**

    Open the extension's options page.

2. **Access the Settings Tab**

    Navigate to the **Settings** tab.

3. **Create an Integration in Raindrop.io**

    Go to Raindrop.io and create an integration for this extension.

    ![Raindrop App Installation](/docs/images/raindrop-app-installation.png)

    > **Note:** The extension identifier in the URL (`https://<EXTENSION_ID>.chromiumapp.org/`) may differ based on the location of the unpacked extension. Please replace it accordingly.

    Now, there are two methods for initializing the application:

    ![RSFC Access Token](/docs/images/rsfc-access-token.png)

    1. **Using a Test Token (Recommended)**

        The simplest and recommended way is to use a test token that never expires. Click on **Create test token** in the app settings in Raindrop, then copy and paste it (no need to click **Register**) into the extension settings' **Access Token** field.

    2. **Registering as an OAuth App**

        Alternatively, you can register the extension as an OAuth app using a client ID and client secret. Copy and paste each value into the settings and click **Register** to authorize the application.

    To run sync manually, go to **Bookmarks** tab and click **Fetch**. Once data is fetched, click **Synchronize**.

    ![RSFC Manual Sync](/docs/images/rsfc-manual-sync.png)

    > **Note:** Manual sync is internal debugging utility. Later it will be rewritten.
