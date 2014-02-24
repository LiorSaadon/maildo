git init
git add .
git commit -m "init"
git remote add heroku git@heroku.com:mailjs.git
git push heroku master -f
heroku open