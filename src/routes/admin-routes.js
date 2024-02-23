import express from 'express';
import passport from 'passport';
import {  getGames,insertGame,getTeams} from '../lib/db.js';
import { xssSanitizationMiddleware } from '../lib/validation.js';

export const adminRouter = express.Router();

async function indexRoute(req, res) {
  return res.render('login', {
    title: 'Innskráning',
  });
}

async function adminRoute(req, res) {
  const user = req.user ?? null;
  const loggedIn = req.isAuthenticated();

  try {
    const games = await getGames();
    const teams = await getTeams();

    const formattedGames = games.map(game => ({
      ...game,
      date: new Date(game.date).toLocaleDateString('is-IS'),
    }));

    return res.render('admin', {
      title: 'Admin upplýsingar, mjög leynilegt',
      user,
      loggedIn,
      games: formattedGames,
      teams,
    });
  } catch (error) {
    console.error('Error while fetching games or teams:', error);
    res.status(500).send('Server error occurred.');
  }
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
  return res.status(403).send('Access Denied: Admins only.');
}


function skraRoute(req, res) {
  return res.redirect('/admin', {
  });
}

async function skraRouteInsert(req, res) {
  const { date, home_team, home_score, away_team, away_score } = req.body;

  try {
    const homeScore = parseInt(home_score, 10);
    const awayScore = parseInt(away_score, 10);


    const currentDate = new Date();
    const gameDate = new Date(date);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

    if (gameDate > currentDate || gameDate < twoMonthsAgo) {
      return res.status(400).send({ error: 'Invalid game date' });
    }
    await insertGame(date, home_team, away_team, homeScore, awayScore);

    res.redirect('/admin');
  } catch (error) {
    console.error('Failed to insert game:', error);
    res.status(500).send('Failed to insert game.');
  }
}





adminRouter.get('/login', indexRoute);
adminRouter.get('/admin', ensureLoggedIn,ensureAdmin, adminRoute);
adminRouter.get('/skra', skraRoute);
adminRouter.post('/admin/skra',
skraRouteInsert,
xssSanitizationMiddleware('description')
);

adminRouter.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/');
  },
  xssSanitizationMiddleware('description'),
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


