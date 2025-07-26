---
head:
  - - meta
    - name: How to run Java Code on Android - Acode
      content: Run java code using the termux and acode on Android 
  - - meta
    - name: keywords
      content: termux run java on Android acode acodex
---

# How to Run Java on Acode Using Termux

If you want to code in Java on **Acode Editor** (assuming you already have it installed), you'll need **Termux**, a Linux terminal emulator for Android. This guide will walk you through the entire setup process, step-by-step.

### Prerequisites
- **Acode Editor** installed on your Android device.
- **Termux**, a terminal emulator for running Linux on Android.

## Step 1: Install Termux via F-Droid

To get started with Termux, you need to install **F-Droid**:

1. **Download and Install F-Droid**:
   - Search for "F-Droid" on your preferred search engine or visit the [F-Droid website](https://f-droid.org/) and download the APK.
   - Install F-Droid on your device.

2. **Install Termux**:
   - install the downloaded termux apk

## Step 2: Setup Termux

After installing Termux, follow these steps to set it up:

1. **Launch Termux for the First Time**:
   - Open Termux and allow it to set up the environment automatically.

2. **Grant Storage Access to Termux**:
   - Run the following command to allow Termux to access your device’s storage:
     ```sh
     termux-setup-storage
     ```

3. **Update Termux Package Repositories and Installed Packages**:
   - Ensure that Termux is up to date by running the following command:
     ```sh
     pkg update && pkg upgrade -y
     ```

4. **Install Java (OpenJDK 17)**:
   - Install the Java Development Kit (JDK) by running:
     ```sh
     pkg install openjdk-17
     ```


::: info
Skip step 3 , if you want don't want to run java code from Acode
:::


## Step 3: Configure Acode with Terminal Integration

Now that Termux is set up, you can integrate Acode with Termux for running Java.

1. **Open Acode Editor**:
   - Launch **Acode Editor** on your device.

2. **Install the AcodeX Plugin(you can choose any other terminal plugin)**:
   - Click the three dots in the top-right corner.
   - Go to **Settings** » **Plugins**.
   - Switch to the **All** tab and install the plugin called **AcodeX - Terminal**.

3. **Install AcodeX Server on Termux**:
   - Open Termux and install the AcodeX server by running the following command:
     ```sh
     curl -sL https://raw.githubusercontent.com/bajrangCoder/acode-plugin-acodex/main/installServer.sh | bash
     ```

4. **Launch the AcodeX Terminal Server**:
   - To start the AcodeX terminal server, run:
     ```sh
     acodex-server
     ```
   - Alternatively, you can use the shorter alias:
     ```sh
     axs
     ```
   - To stop the server, use `CTRL + C`.

## Step 4: Link Your Java Projects with Acode

Once everything is set up, follow these steps to open your Java projects in Acode:

1. **Ensure Your Project Resides in the Termux Storage**:
   - Ensure that your Java project is stored within the Termux accessible filesystem, such as Termux home dir or internal storage or other locations accessible from Termux.

2. **Start the AcodeX Server on Termux**:
   - Ensure the terminal server is running by executing `acodex-server` in Termux.

3. **Add Your Project Folder to Acode**:
   - In Acode, click the three dots, then go to **Files**.
   - Use the **Add Path** (or **+**) button to add Termux paths.
   - Navigate to your Java project folder, select it, and click the **✔** button at the bottom-right corner to add it to the projects sidebar.

4. **Open Your Java Project's Main File**:
   - Navigate to the Java project file you want to work on and open it in Acode.

## Step 5: Compile and Run Java in Acode

Now, you can compile and run your Java code directly in Acode using the terminal.

1. **Open the Terminal**:
   - In Acode, press `CTRL + K` to open the terminal.

2. **Navigate to Your Project Folder**:
   - In the terminal, use the **folder icon** to navigate to your Java project’s directory.

3. **Compile and Run Your Java Code**:
   - To compile your Java file, run the following command:
     ```sh
     javac YourFileName.java
     ```
   - After compiling, run the Java program:
     ```sh
     java YourFileName
     ```

By following these steps, you can successfully run and manage Java projects directly on your Android device using Acode and Termux. Happy coding!