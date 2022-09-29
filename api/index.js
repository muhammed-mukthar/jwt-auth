const e = require("express");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());

const users = [
  {
    id: "1",
    username: "john",
    password: "john@1",
    isAdmin: true,
  },
  {
    id: "2",
    username: "jane",
    password: "jane@1",
    isAdmin: false,
  },
];

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
  //take the refresh token from the user

  const refreshtoken = req.body.token;

  //send error if there is no token or it's invalid

  if (!refreshtoken) return res.status(401).json("you are not authenticated");

  if(!refreshTokens.includes(refreshtoken)){
    return res.status(403).json('refresh token is not valid')
  }
  jwt.verify(refreshtoken,"myrefreshsecretkey",(err,user)=>{
    err && console.log(err);

    refreshTokens.filter((token)=>token !=refreshtoken)
    const newAccessToken=generateAccessToken(user)
    const newRefreshToken=generateRefreshToken(user)
    refreshTokens.push(newRefreshToken)
    res.status(200).json({
        accessToken:newAccessToken,
        refreshToken:newRefreshToken
    })

  })

  //if everything is ok, create new access token, refresh token and send to user
});

const generateAccessToken = (user) => {
 return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "10m",
  });
};
const generateRefreshToken = (user) => {
 return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myrefreshsecretkey");
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });
  if (user) {
    //genrtate access tplem
   const accessToken= generateAccessToken(user);
  const refreshToken=  generateRefreshToken(user);
refreshTokens.push(refreshToken)
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken
    });
  } else {
    res.status(400).json("password or username error happened");
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "mySecretKey", (err, user) => {
      if (err) {
        return res.status(403).json(err,"token is not valid");
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("you are not authenticated");
  }
};

app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("user has been deleted");
  } else {
    res.status(403).json("you are not allowed to delete this tutorial");
  }
});



app.post("/api/logout",verify,(req,res)=>{
    const refreshToken=req.body.token
    refreshTokens=refreshTokens.filter((token)=>token!== refreshToken)
    res.status(200).json("you logout successfully")
})

app.listen(3000, () => {
  console.log("backend server is running");
 
});
