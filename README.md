# uat-javascript-blog
The JavaScript blog engine of the site UndeRTraiN and iCapito.it

### Release: 1.0

This is the first release and all the code is defined inside uat.blog.js.

### Installation

To install copy the content of src folder on your site and change the value for SITE_URL and DATABASE_URL in uat.blog.js file.

Rename the file htaccess-example in .htaccess and enjoy.

For change the template edit the file inside css.

### Usage

All files are stored as an xml that in the DATABASE_URL path.

All link is translated replacing SITE_URL with DATABASE_URL and append at the end ".xml".

If no path was given in the url it loads the default that is pages/home.xml.

You can customize the page not found by editing file DATABASE_URL/pages/404.xml.