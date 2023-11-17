// Importa los módulos necesarios
const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { check, validationResult } = require("express-validator");
const path = require("path");

// Configura la carga de variables de entorno
require("dotenv").config();

// Inicializa la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

// Configura nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configura multer para manejar archivos adjuntos
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("application/pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Limita el tamaño a 5 MB
  },
});

// Configura el directorio de archivos adjuntos
app.use(express.static(path.join(__dirname, "uploads")));
app.use(cors());
// Configura el manejo de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para mostrar información en formato JSON al cargar http://localhost:3000/form
app.get("/", (req, res) => {
  res.json({ message: "Servidor corriendo" });
});

// Ruta para procesar el formulario
app.post("/form-send", upload.single("file"), (req, res) => {
  //res.json({ message: "Servidor POST corriendo" });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { names, lastnames, email, cellphone, subject, message } = req.body;
  const hasAttachment = req.file !== undefined;

  // Configura la información del correo principal
  const mailOptions = {
    from: email,
    to: process.env.EMAIL_RRHH,
    subject: subject,
    text: message,
    attachments: hasAttachment
      ? [
          {
            filename: req.file.originalname,
            content: req.file.buffer,
          },
        ]
      : [],
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                color: #333;
              }

              .email-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }

              h2 {
                color: #007bff;
              }

              p {
                line-height: 1.6;
              }

              li {
                text-align: justify;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h2>¡Nuevo Correo de Contacto!</h2>
              <p>¡Hola!</p>
              <p>Has recibido un nuevo correo de contacto con la siguiente información:</p>

              <ul>
                <li><strong>Nombres:</strong> ${names}</li>
                <li><strong>Apellidos:</strong> ${lastnames}</li>
                <li><strong>Correo Electrónico:</strong> ${email}</li>
                <li><strong>Celular:</strong> ${cellphone}</li>
                <li><strong>Mensaje:</strong> ${message}</li>
              </ul>

              <p>Adjunto encontrarás la hoja de vida del remitente.</p>

              <div class="highlight">
                <p>Por favor, ten en cuenta la hoja de vida adjunta al correo.</p>
              </div>

              <p>¡Gracias!</p>
            </div>
          </body>
        </html>
      `,
  };

  // Envía el correo principal
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.status(500).send("Error al enviar el formulario.");
    }

    console.log("Correo principal enviado: " + info.response);

    // Configura la información del correo de respuesta al usuario
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Formulario Recibido Exitosamente',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                color: #333;
              }

              .email-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }

              h2 {
                color: #007bff;
              }

              p {
                line-height: 1.6;
              }

              .highlight {
                background-color: #e6f7ff;
                padding: 10px;
                border-radius: 4px;
              }

              .thank-you {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
              }

              .logo-container {
                text-align: center;
                margin-bottom: 20px;
              }

              .logo {
                max-width: 100%;
                height: auto;
              }

              .social-icons {
                text-align: center;
                margin-top: 20px;
              }

              .social-icons a {
                display: inline-block;
                margin-right: 10px;
              }

              .social-icons img {
                width: 30px;
                height: 30px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="logo-container">
                <img src="https://impulsarth.netlify.app/assets/logo.png" alt="Logo de la empresa" class="logo" />
              </div>
              <h2>¡Gracias por Contactarnos!</h2>
              <p>Hemos recibido tu formulario y nos pondremos en contacto contigo pronto.</p>
              <p class="thank-you">¡Gracias!</p>
              <div class="highlight">
                <p>Este es un mensaje automático. Por favor, no responda a este correo.</p>
              </div>
              <div class="social-icons">
                <a href="https://www.facebook.com/ImplusarTH2"><img src="https://cdn.icon-icons.com/icons2/1195/PNG/512/1490889652-facebook_82510.png" alt="Facebook" /></a>
                <a href="https://www.instagram.com/impulsar.th/"><img src="https://cdn.icon-icons.com/icons2/1211/PNG/512/1491580635-yumminkysocialmedia26_83102.png" alt="Instagram" /></a>
                <a href="https://api.whatsapp.com/send/?phone=573216035483&text&type=phone_number&app_absent=0"><img src="https://cdn.icon-icons.com/icons2/2429/PNG/512/whatsapp_logo_icon_147205.png" alt="WhatsApp" /></a>
                <a href="mailto:impulsar.th4@gmail.com"><img src="https://cdn.icon-icons.com/icons2/1826/PNG/512/4202011emailgmaillogomailsocialsocialmedia-115677_115624.png" alt="Correo Electrónico" /></a>
              </div>
            </div>
          </body>
        </html>
      `,  
    };

    // Envía el correo de respuesta al usuario
    transporter.sendMail(userMailOptions, function (userError, userInfo) {
      if (userError) {
        console.log(userError);
        return res.status(500).send("Error al enviar el correo de respuesta al usuario.");
      }

      console.log("Correo de respuesta enviado al usuario: " + userInfo.response);
      // Redirige o envía una respuesta al cliente
      res.redirect("https://impulsarth.netlify.app/contactenos.html");
    });
  });
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
  console.log(`Accede a tu aplicación en http://localhost:${PORT}`);
});
