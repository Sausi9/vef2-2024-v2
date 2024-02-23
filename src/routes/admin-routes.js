import express from 'express';
import passport from 'passport';
import {  getGames,insertGame,getTeams,getTeamById} from '../lib/db.js';

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
    const games = await getGames(); // Fetch games from your database
    const teams = await getTeams(); // Assuming this fetches all teams

    // Format each game's date
    const formattedGames = games.map(game => ({
      ...game,
      // Format the date using toLocaleDateString with the 'is-IS' locale for Icelandic
      date: new Date(game.date).toLocaleDateString('is-IS'),
    }));

    return res.render('admin', {
      title: 'Admin upplýsingar, mjög leynilegt',
      user,
      loggedIn,
      games: formattedGames, // Pass the formatted games to the template
      teams, // Pass teams as is
    });
  } catch (error) {
    console.error('Error while fetching games or teams:', error);
    // Handle error, for example by rendering an error page or sending an error status
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
  // Redirect or show an error if the user is not an admin
  return res.status(403).send('Access Denied: Admins only.');
}


function skraRoute(req, res) {
  return res.redirect('/admin', {
  });
}

async function skraRouteInsert(req, res) {
  // Extracting form data
  const { date, home_team, home_score, away_team, away_score } = req.body;

  try {
    // Convert scores to integers
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
adminRouter.post('/admin/skra', skraRouteInsert);

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


