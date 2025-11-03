export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function send(path, options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(headers ?? {}),
    },
    ...rest,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.msg) {
        message = data.msg;
      }
    } catch (err) {
      // Ignore JSON parse errors for failed responses
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (err) {
    return null;
  }
}

export function createAccount(username, password, signal) {
  return send('/api/auth/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    signal,
  });
}

export function login(username, password, signal) {
  return send('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    signal,
  });
}

export function logout(signal) {
  return send('/api/auth/logout', {
    method: 'DELETE',
    signal,
  });
}

export function fetchProfile(signal) {
  return send('/api/profile', {
    method: 'GET',
    signal,
  });
}

export function fetchAuditHistory(signal) {
  return send('/api/audit/history', {
    method: 'GET',
    signal,
  });
}

export function submitAuditFile(file, signal) {
  const formData = new FormData();
  formData.append('file', file);

  return send('/api/audit', {
    method: 'POST',
    body: formData,
    signal,
  });
}
