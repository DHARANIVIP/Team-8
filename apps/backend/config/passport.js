import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

const apiBaseUrl = (process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');

// ── Google Strategy (only registered when credentials are provided) ──────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: apiBaseUrl + '/api/auth/google/callback',
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;
          if (!email) {
            return done(new Error('Email is required from Google account.'), null);
          }
          let user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            user = new User({
              email: email.toLowerCase(),
              name:
                profile.displayName ||
                (profile.name && profile.name.givenName) ||
                'Google User',
              passwordHash: 'OAuthAccount',
              salt: 'OAuthAccount',
            });
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GOOGLE_CLIENT_ID/SECRET not set — Google OAuth disabled.');
}

// ── GitHub Strategy (only registered when credentials are provided) ──────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: apiBaseUrl + '/api/auth/github/callback',
        scope: ['user:email'],
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          let email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;
          if (!email) {
            email = profile.username
              ? profile.username + '@github.com'
              : null;
          }
          if (!email) {
            return done(new Error('Email is required from GitHub account.'), null);
          }
          let user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            user = new User({
              email: email.toLowerCase(),
              name: profile.displayName || profile.username || 'GitHub User',
              passwordHash: 'OAuthAccount',
              salt: 'OAuthAccount',
            });
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GITHUB_CLIENT_ID/SECRET not set — GitHub OAuth disabled.');
}

export default passport;
