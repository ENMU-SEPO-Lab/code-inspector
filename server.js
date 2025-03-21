import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Octokit } from '@octokit/rest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const githubToken = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: githubToken });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const repoOwner = 'ENMU-SEPO-Lab';  // Updated repo owner
        const repoName = 'code-inspector';  // Ensure correct repo name
        const uploadPath = `uploads/${filename}`;

        // Step 1: Get the latest commit SHA for the branch
        const { data: branchData } = await octokit.rest.repos.getBranch({
            owner: repoOwner,
            repo: repoName,
            branch: branchName,
        });

        const baseSha = branchData.commit.sha;

        // Step 2: Check if the "uploads" folder exists
        let folderContents = [];
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: "uploads",
                ref: branchName,
            });
            folderContents = Array.isArray(data) ? data : [];
        } catch (err) {
            console.warn("Uploads folder not found, creating a new one.");
        }

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
