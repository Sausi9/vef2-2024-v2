import express from 'express';
import passport from 'passport';
import {  getGames,insertGame } from '../lib/db.js';

export const adminRouter = express.Router();

async function indexRoute(req, res) {
  return res.render('login', {
    title: 'Innskráning',
  });
}

async function adminRoute(req, res) {
  const user = req.user ?? null;
  const loggedIn = req.isAuthenticated();
  const games = await getGames();

  return res.render('admin', {
    title: 'Admin upplýsingar, mjög leynilegt',
    user,
    loggedIn,
    games,
  });
}


// TODO færa á betri stað
// Hjálpar middleware sem athugar hvort notandi sé innskráður og hleypir okkur
// þá áfram, annars sendir á /login
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.admin) {
    return next();
  }
  // Redirect or show an error if the user is not an admin
  return res.status(403).send('Access Denied: Admins only.');
}


function skraRoute(req, res, next) {
  return res.render('skra', {
    title: 'Skrá leik',
  });
}

function skraRouteInsert(req, res, next) {
  // TODO mjög hrátt allt saman, vantar validation!
  const { homeName, homeScore, awayName, awayScore } = req.body;

  const result = insertGame(homeName, homeScore, awayName, awayScore);

  res.redirect('/leikir');
}

adminRouter.get('/login', indexRoute);
adminRouter.get('/admin', ensureLoggedIn,ensureAdmin, adminRoute);
adminRouter.get('/skra', skraRoute);
adminRouter.post('/skra', skraRouteInsert);

adminRouter.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  },
);


adminRouter.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
    return undefined;
  });
});


