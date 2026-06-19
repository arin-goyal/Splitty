import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, criticality } = req.body;
    const userId = req.userId;

    if (!title || !description || criticality === undefined) {
      return res.status(400).json({ error: 'Title, description, and criticality rating are required.' });
    }

    const rating = Number(criticality);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Criticality must be an integer between 1 and 5.' });
    }

    // Fetch user details for the report
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Reporting user not found.' });
    }

    const criticalityStars = '!'.repeat(rating);
    const issueBody = `### Description\n${description.trim()}\n\n### Details\n- **Criticality**: ${criticalityStars} (${rating}/5)\n- **Reported By**: ${user.name} (${user.email})\n- **Date**: ${new Date().toLocaleString()}\n\n---\n*Sent automatically from Splitty Client*`;

    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;

    if (githubToken && repoOwner && repoName) {
      console.log(`[BUG REPORT] Attempting to submit issue to GitHub repository: ${repoOwner}/${repoName}...`);

      const githubResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Splitty-App-Backend',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[Bug] ${title.trim()}`,
          body: issueBody,
          labels: ['bug'],
        }),
      });

      if (!githubResponse.ok) {
        const errorText = await githubResponse.text();
        console.error('[BUG REPORT] GitHub API Error Response:', errorText);
        throw new Error(`GitHub API returned status ${githubResponse.status}`);
      }

      const issueData = (await githubResponse.json()) as any;
      console.log(`[BUG REPORT] GitHub Issue created successfully: ${issueData.html_url}`);

      return res.status(200).json({
        success: true,
        message: 'Bug report sent to GitHub successfully!',
        url: issueData.html_url,
      });
    } else {
      // Local development fallback log
      console.log('\n\x1b[35m=== [LOCAL BUG REPORT] ===\x1b[0m');
      console.log(`Title:       [Bug] ${title.trim()}`);
      console.log(`Criticality: ${criticalityStars} (${rating}/5)`);
      console.log(`Reporter:    ${user.name} (${user.email})`);
      console.log('Description:');
      console.log(description.trim());
      console.log('\x1b[35m===========================\x1b[0m\n');

      return res.status(200).json({
        success: true,
        message: '[Development Fallback] Bug logged to server console successfully. Set GITHUB_TOKEN in env to submit to GitHub Issues.',
      });
    }
  } catch (err: any) {
    console.error('[BUG REPORT] Error reporting bug:', err.message);
    res.status(500).json({ error: 'Failed to submit bug report. Please try again later.' });
  }
});

export default router;
