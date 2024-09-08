const express = require("express");
const cors = require("cors");
const request = require("request");
const app = express();
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const path = require("path");
const bodyParser = require("body-parser");

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (for images)
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse JSON and urlencoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("No URL provided");
  }
  request(url).pipe(res);
});

app.post("/placeOrder", async (req, res) => {
  console.log("hiii");
  console.log(req.body);
  const { cart, userData, totalPrice,discount } = req.body;
  console.log(totalPrice+" "+discount);
  const billData = {
    billNo: "A0012", // You can also make this dynamic
    userData,
    cart,
    totalPrice,
    discount
  };

  // Generate PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(await renderTemplate("bill", { bill: billData }), {
    waitUntil: "networkidle2",
  });

  // Save the PDF to a buffer (in-memory storage)
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  // Send email with the PDF attachment
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use the service you're using, e.g. Gmail, Yahoo, etc.
    auth: {
      user: "muhilkumaran@gmail.com",
      pass: "lkmvwumfkxzfblxe",
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com', // Sender address
    to: userData.email, // Recipient's email
    subject: 'Your Order Receipt',
    text: `Dear ${userData.name},\n\nPlease find attached the receipt for your order.\n\nThank you for shopping with us!`,
    attachments: [
      {
        filename: 'order_receipt.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: "Failed to send email" });
    } else {
      console.log("Email sent: ");
      return res.status(200).send({ message: "Email sent successfully" });
    }
  });
});

const renderTemplate = (view, data) => {
  return new Promise((resolve, reject) => {
    app.render(view, data, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
};
app.listen(8000, () => {
  console.log("Server running on port 8000");
});
 
