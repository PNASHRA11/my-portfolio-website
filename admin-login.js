// ADMIN LOGIN FORM

document.addEventListener("DOMContentLoaded",function(){

const adminLoginForm=document.getElementById("adminLoginForm");
const adminUsername=document.getElementById("adminUsername");
const adminPassword=document.getElementById("adminPassword");
const togglePassword=document.getElementById("togglePassword");
const loginError=document.getElementById("loginError");
const forgotPassword=document.getElementById("forgotPassword");

// CHECK HTML ELEMENTS
console.log("Login Form:",adminLoginForm);
console.log("Username Input:",adminUsername);
console.log("password :",adminPassword);


// SHOW / HIDE PASSWORD

togglePassword.addEventListener("click",function(){
    if(adminPassword.type==="password"){
        adminPassword.type="text";
        togglePassword.textContent="Hide";
    }else{
        adminPassword.type="password";
        togglePassword.textContent="show";
    }
});

// LOGIN CHECK
adminLoginForm.addEventListener("submit",function(event){
    event.preventDefault();

    const username=adminUsername.value.trim();
    const password=adminPassword.value;

    loginError.textContent="";

    console.log("username: ",username);
    console.log("password :",password);

    // TEMPORARY DEMO CREDENTIALS
    const correctUsername="admin";
    const correctPassword="12345";
    if(username===correctUsername && password === correctPassword){
        localStorage.setItem("adminLoggedIn","true");
        window.location.href="admin.html";

    }else{
        loginError.textContent="Invalid username or password.";
    }
});

// FORGOT PASSWORD
forgotPassword.addEventListener("click",function(event){
    event.preventDefault();

    alert("Forgot password feature will be connected with backend/email later.");
  });
});