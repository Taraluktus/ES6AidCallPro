export const SERVER_URL = "http://localhost:3000/";


export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    let error = new Error(response.statusText);
    throw error;
  }
}

export function parseJSON(response) {
  return response.json();
}
