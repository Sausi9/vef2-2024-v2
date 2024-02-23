import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { adminRouter } from './routes/admin-routes.js';
import { environment } from './lib/environment.js';
import { handler404, handlerError } from './lib/handlers.js';
import { logger } from './lib/logger.js';
import { indexRouter } from './routes/index-routes.js';
import { comparePasswords, findById, findByUsername } from './lib/users.js';

const env = environment(process.env, logger);

if (!env) {
  process.exit(1);
}

const { port, sessionSecret } = env;
const path = dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Passport mun verða notað með session
const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
};
app.use(session(sessionOptions));

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function strat(username, password, done) {
  console.log(`Authenticating user: ${username}`);
  try {
    const user = await findByUsername(username);
    if (!user) {
      console.log('User not found');
      return done(null, false); // User not found
    }
    const result = await comparePasswords(password, user);
    if (!result) {
      console.log('Incorrect password');
      return done(null, false); // Incorrect password
    }
    console.log('User authenticated successfully');
    return done(null, user); // Success
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

// Notum local strategy með „strattinu“ okkar til að leita að notanda
passport.use(new Strategy(strat));

passport.serializeUser((user, done) => {
  if ('id' in user) {
    done(null, user.id);
  } else {
    done(new Error('User object does not have an id property'));
  }
});


// Sækir notanda út frá id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Látum express nota passport með session
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/', adminRouter);
app.use(express.static(join(path, '../public')));
app.use(handler404);
app.use(handlerError);

app.listen(port, () => {
  console.info(`🚀 Server running at http://localhost:${port}/`);
});


