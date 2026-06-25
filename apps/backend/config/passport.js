import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!email) {
        return done(new Error('Email is required from Google account.'), null);
      }
      
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          name: profile.displayName || profile.name?.givenName || 'Google User',
          passwordHash: 'OAuthAccount', // Placeholder for OAuth user
          salt: 'OAuthAccount'
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/api/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!email) {
        // Fallback email if profile email is hidden
        email = profile.username ? `${profile.username}@github.com` : null;
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
          salt: 'OAuthAccount'
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

export default passport;
