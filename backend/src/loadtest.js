import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8000/api';

export const options = {
  vus: 10000,
  duration: '1m',
  // give setup plenty of time to spin up
  setupTimeout: '10m',
  // you can also limit sockets per host if you want:
  http: { maxConnectionsPerHost: 2000 },
};

//
// setup() will run **once**, on a single VU, before the load phase.
// Here we register (or log in) 10 000 users, one after another.
//
export function setup() {
  const users = [];

  for (let i = 1; i <= 10000; i++) {
    const isDoctor = i % 2 === 0;
    const unique   = `${i}`;
    const email    = isDoctor
      ? `doctor${unique}@loadtest.local`
      : `patient${unique}@loadtest.local`;

    const payload = isDoctor
      ? {
          email,
          password: 'Password123!',
          role: 'doctor',
          firstName: `Doc${unique}`,
          lastName: 'Load',
          specialization: 'General',
          phoneNumber: '555-0000',
        }
      : {
          email,
          password: 'Password123!',
          role: 'patient',
          firstName: `Pat${unique}`,
          lastName: 'Load',
          dateOfBirth: '1990-01-01',
          gender: 'female',
          phoneNumber: '555-1111',
        };

    // 1) Try register
    let res = http.post(
      `${BASE}/auth/register`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    // if “already exists”, fall back to login
    if (res.status === 400) {
      try {
        const body = res.json();
        if (body.message === 'User already exists') {
          res = http.post(
            `${BASE}/auth/login`,
            JSON.stringify({ email: payload.email, password: payload.password }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (_e) {
        // ignore parse errors
      }
    }

    // if we still don’t have a token, log it and skip
    if (res.status !== 200 && res.status !== 201) {
      console.error(`✖ user ${email} setup failed:`, res.status, res.body);
      continue;
    }

    // extract token and user.id
    const loginBody = res.json();
    users.push({
      email,
      password: payload.password,
      token: loginBody.token,
      id: loginBody.user.id,
    });

    // throttle so we don’t blow out Postgres
    if (i % 100 === 0) {
      sleep(0.5);
    }
  }

  return users;
}

//
// default() is run by all 10 000 VUs, concurrently, for 1 minute.
// We simply pick one of the pre-registered users (by __VU),
// attach their token, and hit “normal” endpoints.
//
export default function (users) {
  const idx = (__VU - 1) % users.length;
  const user = users[idx];
  const authHeaders = {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${user.token}`,
    },
  };

  // 1) Fetch all appointments
  const appts = http.get(`${BASE}/appointments`, authHeaders);
  check(appts, { 'GET /appointments → 200': r => r.status === 200 });

  // 2) Fetch all prescriptions
  const rx = http.get(`${BASE}/prescriptions`, authHeaders);
  check(rx, { 'GET /prescriptions → 200': r => r.status === 200 });

  // 3) List message conversations
  const convos = http.get(
    `${BASE}/messages/conversations/${user.id}`,
    authHeaders
  );
  check(convos, { 'GET /messages/conversations → 200': r => r.status === 200 });

  sleep(Math.random() * 2 + 1);
}
