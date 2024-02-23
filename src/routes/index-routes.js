import express from 'express';
import { getGames, getStandings} from '../lib/db.js';

export const indexRouter = express.Router();

async function indexRoute(req, res) {
  const loggedIn = req.isAuthenticated();
  const user = req.user ?? null;
  let admin = false;
  if(user?.admin){
    admin = user.admin
  }
  return res.render('index', {
    title: 'Forsíða',
    time: new Date().toISOString(),
    user,
    loggedIn,
    admin,
  });
}

async function leikirRoute(req, res) {
  const games = await getGames();
  const loggedIn = req.isAuthenticated();
  const user = req.user ?? null;
  let admin = false;
  if(user?.admin){
    admin = user.admin
  }

  const formattedGames = games.map(game => ({
    ...game,
    // Format the date using toLocaleDateString with the 'is-IS' locale for Icelandic
    date: new Date(game.date).toLocaleDateString('is-IS'),
  }));

  return res.render('leikir', {
    title: 'Leikir',
    games: formattedGames,
    time: new Date().toISOString(),
    user,
    loggedIn,
    admin,
  });
}

async function stadaRoute(req, res) {
  const standings = await getStandings();
  const loggedIn = req.isAuthenticated();
  const user = req.user ?? null;
  let admin = false;
  if(user?.admin){
    admin = user.admin
  }
  return res.render('stada', {
    title: 'Staðan',
    standings,
    user,
    loggedIn,
    admin,
  });
}

indexRouter.get('/', indexRoute);
indexRouter.get('/leikir', leikirRoute);
indexRouter.get('/stada', stadaRoute);
indexRouter.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
    return undefined;
  });
});
