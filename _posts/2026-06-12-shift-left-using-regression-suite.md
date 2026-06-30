---
layout: post
title: "Shift Left Using a Regression Suite: A Practical Approach"
date: 2026-06-12
categories: [best-practices, devops]
tags: [shift-left, regression-testing, test-strategy, devops, agile]
excerpt: "Incorporate the **regression suite** developed for **Quality Control** (QC) to ensure **Quality Assurance** (QA) by embedding it early in the development cycle when creating or adding new features to an existing product."
reading_time: 4
---

- [Shift Left using Regression suite](#shift-left-using-regression-suite)
  - [Introduction](#introduction)
  - [Benefits of Shift Left with Early Regression Testing](#benefits-of-shift-left-with-early-regression-testing)
  - [Approach](#approach)
    - [Step-by-Step Guide](#step-by-step-guide)
    - [Explanation](#explanation)
    - [How to Run](#how-to-run)
    - [Summary](#summary)
    - [Step-by-Step Guide to Configure Express.js](#step-by-step-guide-to-configure-expressjs)
  - [Summary](#summary-1)

# Shift Left using Regression suite

Incorporate the **regression suite** developed for **Quality Control** (QC) to ensure **Quality Assurance** (QA) by embedding it early in the development cycle when creating or adding new features to an existing product.


## Introduction 
To improve our software quality and streamline our development process, we propose adopting the “Shift Left” approach. This involves integrating our regression suite, initially developed for Quality Control (QC), into the early stages of the development cycle to ensure Quality Assurance (QA).
## Benefits of Shift Left with Early Regression Testing
1. **Early Detection of Issues**: By embedding regression tests early, we can identify and address defects as new features are developed, reducing the risk of issues in later stages.
2. **Continuous Quality Assurance**: Integrating the regression suite from the start ensures continuous QA, maintaining high standards throughout the development process.
3. **Improved Efficiency**: Early testing helps catch and fix issues sooner, leading to more efficient development cycles and faster time-to-market.
4. **Reduced Technical Debt**: Proactively addressing defects early minimizes technical debt, resulting in a more stable and maintainable codebase.
##Implementation 
To successfully implement this approach, we will:
• **Embed Regression Suite Early**: Integrate the existing regression suite into the development process when creating or adding new features.
• **Automate Testing**: Utilize automated testing tools to run regression tests continuously.
• **Promote Collaboration**: Encourage collaboration between developers and testers to ensure alignment on quality standards and requirements.


## Approach
1. You can integrate the QA regression suite as a dependent project ```(.csproj)``` within your solution file ```(.sln)```.
2. Modify the configuration ```.runsetting``` to point to ```localhost``` and add the following code:

To automatically start the Express.js server as a precondition in your C# `Startup` class, you can use the `Process` class in .NET to run the Node.js server. This way, the server will start when your application starts. Here's how you can do it:

### Step-by-Step Guide

1. **Modify the `Startup` class**:
   Update your `Startup` class to include a method that starts the Express.js server. This method will be called during the service configuration.

   ```csharp
   using System.Diagnostics;
   using Microsoft.Extensions.Configuration;
   using Microsoft.Extensions.DependencyInjection;

   public static class Startup
   {
       public static IServiceCollection CreateServices()
       {
           var services = new ServiceCollection();

           // Add your service configurations here

           // Start the Express.js server if running locally
           if (IsDevelopmentEnvironment())
           {
               StartExpressServer();
           }

           return services;
       }

       private static bool IsDevelopmentEnvironment()
       {
           string? env = Environment.GetEnvironmentVariable("ENVIRONMENT");
           return env == "Development";
       }

       private static void StartExpressServer()
       {
           var startInfo = new ProcessStartInfo
           {
               FileName = "node",
               Arguments = "server.js",
               WorkingDirectory = @"path\to\your\src\directory",
               RedirectStandardOutput = true,
               RedirectStandardError = true,
               UseShellExecute = false,
               CreateNoWindow = true
           };

           var process = new Process { StartInfo = startInfo };
           process.OutputDataReceived += (sender, args) => Console.WriteLine(args.Data);
           process.ErrorDataReceived += (sender, args) => Console.WriteLine(args.Data);

           process.Start();
           process.BeginOutputReadLine();
           process.BeginErrorReadLine();
       }
   }
   ```

### Explanation

- **StartExpressServer Method**: This method uses the `Process` class to start the Node.js server. It sets up the process to run `node server.js` in the specified working directory.
- **Environment Check**: The `CreateServices` method checks if the environment is "Development" and starts the Express.js server if it is.

### How to Run

1. **Ensure Node.js and Express.js are set up**:
   Make sure your Express.js server is correctly set up and can be started with `node server.js`.

2. **Run your C# application**:
   When you run your C# application, it will automatically start the Express.js server if the environment is set to "Development".

### Summary
This setup ensures that your Express.js server is automatically started as a precondition when running your C# application in the development environment. This allows you to seamlessly integrate your Node.js server with your C# services.

***
### Step-by-Step Guide to Configure Express.js

1. **Install Node.js and Express.js**:
   First, ensure you have Node.js installed. Then, create a new directory for your Express.js server and navigate to it in your terminal. Run the following commands to initialize a new Node.js project and install Express.js:

   ```bash
   mkdir my-express-server
   cd my-express-server
   npm init -y
   npm install express
   ```

2. **Create the Express.js Server**:
   Create a file named `server.js` in your project directory and add the following code to set up a basic Express.js server:

   ```javascript
   const express = require('express');
   const app = express();
   const port = 3000;

   app.get('/', (req, res) => {
       res.send('Hello World!');
   });

   app.listen(port, () => {
       console.log(`Express server listening at http://localhost:${port}`);
   });
   ```

3. **Configure the Working Directory**:
   Ensure the `WorkingDirectory` in your C# `Startup` class points to the directory where your `server.js` file is located. For example:

   ```csharp
   private static void StartExpressServer()
   {
       var startInfo = new ProcessStartInfo
       {
           FileName = "node",
           Arguments = "server.js",
           WorkingDirectory = @"path\to\your\my-express-server\directory",
           RedirectStandardOutput = true,
           RedirectStandardError = true,
           UseShellExecute = false,
           CreateNoWindow = true
       };

       var process = new Process { StartInfo = startInfo };
       process.OutputDataReceived += (sender, args) => Console.WriteLine(args.Data);
       process.ErrorDataReceived += (sender, args) => Console.WriteLine(args.Data);

       process.Start();
       process.BeginOutputReadLine();
       process.BeginErrorReadLine();
   }
   ```

4. **Run the C# Application**:
   When you run your C# application, it will automatically start the Express.js server if the environment is set to "Development".

## Summary

- **Node.js and Express.js Installation**: Ensure Node.js is installed and set up a new Express.js project.
- **Express.js Server Setup**: Create a basic Express.js server in `server.js`.
- **C# Configuration**: Update the `WorkingDirectory` in your C# `Startup` class to point to your Express.js project directory.

This configuration allows your Express.js server to start automatically when your C# application runs, making it easy to integrate both environments.

Source: 
* github.com. https://github.com/BioBoost/docker-course-for-linux/tree/4763fea0f8316ffc4199e8ce937d4c6a16ee3cae/05_building_images%2Freadme.md.
* github.com. https://github.com/madhur-jajoo/node_examples/tree/e25662a1738bd38a19ecd05ba0868b7e30c1cc2d/basic_express_app%2Findex.js.
* github.com. https://github.com/aws-containers/apprunnerworkshop/tree/033cef31f37577671783495f5ff23005db064e8c/content%2Fgetting-started%2Fgithub%2Frepo%2F_index.md.
* github.com. https://github.com/roman-g/test-runner/tree/84d8cd532c5265afea7084dbe46c086151fc0e61/TestSolution%2FTestAgent%2FTestAgentActor.cs.

***
