const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'juan.perez@sena.edu.co',
      password: 'instructor123'
    });
    console.log('Login exitoso:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error de login:', error.response.status, error.response.data);
    } else {
      console.error('Error de conexión:', error.message);
    }
  }
}

testLogin();
