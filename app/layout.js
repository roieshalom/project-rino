export const metadata = {
    title: "ספר המתכונים",
    description: "אוסף המתכונים של טלי, רינו, ורועי",
};

export default function RootLayout({ children }) {
    return (
          <html lang="he" dir="rtl">
            <head>
              <link rel="manifest" href="/manifest.json" />
              <meta name="theme-color" content="#1E1208" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
              <meta name="apple-mobile-web-app-title" content="מתכונים" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;700;900&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet" />
              <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wa2ahtzmn0");` }} />
      </head>
        <body>{children}</body>
      </html>
    );
}
