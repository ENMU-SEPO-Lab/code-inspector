// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const { Octokit } = require("@octokit/rest");
// const path = require('path');

// const app = express();
// const port = 3001;
// const githubToken = process.env.GITHUB_TOKEN;
// const octokit = new Octokit({ auth: githubToken });

// app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));

// // Setup multer for file uploads (stored in memory)
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // GitHub Repo Details
// const GITHUB_OWNER = "imhmede";
// const GITHUB_REPO = "CodeInspector";
// const BASE_BRANCH = "jenkins"; // Main branch to base new branches on

// // Handle file upload and GitHub commit
// app.post('/upload', upload.single('file'), async (req, res) => {
//     if (!req.file || !req.body.email) {
//         return res.status(400).json({ success: false, message: "File and email are required" });
//     }

//     const { file, body } = req;
//     const { email } = body;
//     const filename = file.originalname;
//     const fileContent = file.buffer.toString('base64');
//     const commitMessage = `Upload: ${filename} by ${email}`;
    
//     try {
//         // Generate branch name from email prefix
//         const emailPrefix = email.split('@')[0];
//         const branchName = BASE_BRANCH; // Always use "jenkins" branch
//         // const branchName = emailPrefix.replace(/[^a-zA-Z0-9]/g, '_');

//         // Get latest commit SHA of the base branch
//         const { data: baseBranchData } = await octokit.rest.repos.getBranch({
//             owner: GITHUB_OWNER,
//             repo: GITHUB_REPO,
//             branch: BASE_BRANCH,
//         });

//         const baseSha = baseBranchData.commit.sha;

//         // Create new branch from base branch (if not exists)
//         try {
//             await octokit.rest.git.createRef({
//                 owner: GITHUB_OWNER,
//                 repo: GITHUB_REPO,
//                 ref: `refs/heads/${branchName}`,
//                 sha: baseSha,
//             });
//         } catch (err) {
//             console.log(`Branch ${branchName} might already exist.`);
//         }

//         // Commit file to new branch
//         await octokit.rest.repos.createOrUpdateFileContents({
//             owner: GITHUB_OWNER,
//             repo: GITHUB_REPO,
//             path: `Upload_here/${filename}`,
//             message: commitMessage,
//             content: fileContent,
//             branch: branchName
//         });

//         res.json({ success: true, message: `File uploaded and committed to branch ${branchName}` });
//     } catch (error) {
//         console.error("Upload failed:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Octokit } = require("@octokit/rest");
const path = require('path');

const githubToken = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: githubToken });

const app = express();
app.use(cors());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { file, body } = req;
    const { email } = body;
    const filename = file.originalname;

    try {
        const branchName = "jenkins";
        const commitMessage = `Upload: ${filename} by ${email}`;
        const repoOwner = 'imhmede';
        const repoName = 'code-inspector';
        const uploadPath = `uploads/${filename}`;

        // Step 1: Get the latest commit SHA for the branch
        const { data: branchData } = await octokit.rest.repos.getBranch({
            owner: repoOwner,
            repo: repoName,
            branch: branchName,
        });

        const baseSha = branchData.commit.sha;

        // Step 2: List files in "Upload_here" directory
        const { data: folderContents } = await octokit.rest.repos.getContent({
            owner: repoOwner,
            repo: repoName,
            path: "uploads",
            ref: branchName,
        });

        // Step 3: Delete all files except ".gitignore"
        for (const file of folderContents) {
            if (file.name !== ".gitignore") {
                await octokit.rest.repos.deleteFile({
                    owner: repoOwner,
                    repo: repoName,
                    path: `uploads/${file.name}`,
                    message: `Cleanup: Removed ${file.name}`,
                    sha: file.sha,
                    branch: branchName,
                });
            }
        }

        // Step 4: Convert file to Base64
        const base64File = file.buffer.toString('base64');

        // Step 5: Commit the new file
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: uploadPath,
            message: commitMessage,
            content: base64File,
            branch: branchName,
        });

        res.json({ success: true, message: "File uploaded and old files cleaned." });
    } catch (error) {
        console.error("Operation failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});

// const express = require("express");
// const cors = require("cors");
// const multer = require("multer");
// const { Octokit } = require("@octokit/rest");
// const path = require("path");
// const fs = require("fs");
// const unzipper = require("unzipper");
// const tar = require("tar");

// const app = express();
// const port = 3001;
// const MAX_FILES = 10;

// app.use(cors());
// const uploadDir = path.join(__dirname, "upload_here");
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const upload = multer({ dest: uploadDir }).array("files", MAX_FILES);
// const githubToken = process.env.GITHUB_TOKEN;
// const octokit = new Octokit({ auth: githubToken });

// app.post("/upload", upload, async (req, res) => {
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ message: "No files uploaded." });
//     }

//     const email = req.body.email;
//     const repoOwner = "imhmede";
//     const repoName = "CodeInspector";
//     const branchName = "jenkins";

//     try {
//         const { data: branchData } = await octokit.rest.repos.getBranch({
//             owner: repoOwner,
//             repo: repoName,
//             branch: branchName,
//         });
//         const baseSha = branchData.commit.sha;

//         const { data: folderContents } = await octokit.rest.repos.getContent({
//             owner: repoOwner,
//             repo: repoName,
//             path: "upload_here",
//             ref: branchName,
//         });

//         for (const file of folderContents) {
//             if (file.name !== ".gitignore") {
//                 await octokit.rest.repos.deleteFile({
//                     owner: repoOwner,
//                     repo: repoName,
//                     path: `upload_here/${file.name}`,
//                     message: `Cleanup: Removed ${file.name}`,
//                     sha: file.sha,
//                     branch: branchName,
//                 });
//             }
//         }

//         for (const file of req.files) {
//             const ext = path.extname(file.originalname);
//             const filename = file.originalname;

//             if (ext === ".java") {
//                 await commitFile(fs.readFileSync(file.path), `upload_here/${filename}`, `Upload: ${filename} by ${email}`);
//             } else if (ext === ".zip" || ext === ".tar") {
//                 const extractedFiles = await extractAndFilterJavaFiles(file.path, ext);

//                 if (extractedFiles.length > MAX_FILES) {
//                     return res.status(400).json({ 
//                         success: false, 
//                         error: `Too many files! Limit is ${MAX_FILES}. Found: ${extractedFiles.length}`
//                     });
//                 }

//                 for (const { content, filePath } of extractedFiles) {
//                     await commitFile(content, filePath, `Upload extracted: ${filePath} by ${email}`);
//                 }
//             }
//         }

//         res.json({ success: true, message: "Files uploaded successfully!" });
//     } catch (error) {
//         console.error("Upload failed:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// async function commitFile(fileContent, filePath, commitMessage) {
//     const repoOwner = "imhmede";
//     const repoName = "CodeInspector";
//     const branchName = "jenkins";

//     const base64Content = fileContent.toString("base64");

//     await octokit.rest.repos.createOrUpdateFileContents({
//         owner: repoOwner,
//         repo: repoName,
//         path: filePath,
//         message: commitMessage,
//         content: base64Content,
//         branch: branchName,
//     });
// }

// async function extractAndFilterJavaFiles(filePath, ext) {
//     const tempFolder = "temp_extract";
//     fs.mkdirSync(tempFolder, { recursive: true });

//     if (ext === ".zip") {
//         await fs.createReadStream(filePath)
//             .pipe(unzipper.Extract({ path: tempFolder }))
//             .promise();
//     } else if (ext === ".tar") {
//         await tar.x({ file: filePath, cwd: tempFolder });
//     }

//     const javaFiles = [];
//     function readDir(directory) {
//         const files = fs.readdirSync(directory);
//         if (files.length > MAX_FILES) {
//             throw new Error(`Too many files inside the archive. Limit is ${MAX_FILES}.`);
//         }
//         for (const file of files) {
//             const fullPath = path.join(directory, file);
//             const relativePath = path.relative(tempFolder, fullPath);
//             if (fs.statSync(fullPath).isDirectory()) {
//                 readDir(fullPath);
//             } else if (file.endsWith(".java")) {
//                 javaFiles.push({
//                     content: fs.readFileSync(fullPath),
//                     filePath: `upload_here/${relativePath}`
//                 });
//             }
//         }
//     }
//     readDir(tempFolder);
//     fs.rmSync(tempFolder, { recursive: true, force: true });
//     return javaFiles;
// }

// app.listen(port, () => console.log(`Server running on port ${port}`));
