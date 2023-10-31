const error_code = {
  401: "you need to login first.",
  403: "Forbidden.",
  400: "Bad Request."
}

const message = (code) => {
  if (error_code[code] !== undefined) return error_code[code];
  return code;
}

const code404 = () => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
          body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: Impact, sans-serif;
              background-color: #1c1c1c;
              color: #fff;
              text-align: center;
          }
  
          .container {
              max-width: 600px;
              padding: 50px;
              background-color: #333;
              border-radius: 5px;
          }
  
          h1 {
              font-size: 3em;
              color: #fff;
          }
  
          footer {
              margin-top: 20px;
              font-size: 1em;
              color: #777;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>404 - Page Not Found</h1>
          <footer>&copy; 2023 Fall Hector - meeting room booking -. All rights reserved.</footer>
      </div>
  </body>
  </html>
  `;
}

module.exports = { message, code404 }