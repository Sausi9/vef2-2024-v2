/* eslint-disable import/no-unresolved */
import pg from 'pg';
import { environment } from './environment.js';
import { logger } from './logger.js';

const env = environment(process.env, logger);

if (!env?.connectionString) {
  process.exit(-1);
}

const { connectionString } = env;
const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('unable to query', e);
    console.info(q, values);
    return null;
  } finally {
    client.release();
  }
}

export async function getGames() {
  const q = `
    SELECT
      date,
      home_team.name AS home_name,
      home_score,
      away_team.name AS away_name,
      away_score
    FROM
      games
    LEFT JOIN
      teams AS home_team ON home_team.id = games.home
    LEFT JOIN
      teams AS away_team ON away_team.id = games.away
    ORDER BY
      date DESC
  `;

  const result = await query(q);

  const games = [];
  if (result && (result.rows?.length ?? 0) > 0) {
    for (const row of result.rows) {
      const game = {
        date: row.date,
        home: {
          name: row.home_name,
          score: row.home_score,
        },
        away: {
          name: row.away_name,
          score: row.away_score,
        },
      };
      games.push(game);
    }

    return games;
  }
  return games;
}
export async function getStandings() {
  const games = await getGames();
  const standings = {};

  games.forEach((game) => {
    const { home, away } = game;
    if (!standings[home.name]) standings[home.name] = { points: 0 };
    if (!standings[away.name]) standings[away.name] = { points: 0 };

    if (home.score > away.score) {
      standings[home.name].points += 3;
    } else if (home.score < away.score) {
      standings[away.name].points += 3;
    } else { // Tie
      standings[home.name].points += 1;
      standings[away.name].points += 1;
    }
  });

  const sortedStandings = Object.keys(standings).map(team => ({
    name: team,
    points: standings[team].points
  })).sort((a, b) => b.points - a.points);

  return sortedStandings;
}


export async function getTeams() {
  const q = 'SELECT id,name FROM teams ORDER BY name';
  const result = await query(q);
  return result.rows;
}

export async function insertGame(date, homeTeamId, awayTeamId, homeScore, awayScore) {
  const q = 'INSERT INTO games (date, home, away, home_score, away_score) VALUES ($1, $2, $3, $4, $5);';
  await query(q, [date, homeTeamId, awayTeamId, homeScore, awayScore]);
}



export async function end() {
  await pool.end();
}



export async function getTeamById(teamId) {
  const q = 'SELECT id FROM teams WHERE id = $1;';
  const result = await query(q, [teamId]);
  if (result.rows.length > 0) {
    // @ts-ignore
    return result.rows[0].id;
  }
    throw new Error(`Team not found with ID: ${teamId}`);

}




export async function testDbConnection() {
  try {
    const result = await pool.query('SELECT 1 AS number;');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}

