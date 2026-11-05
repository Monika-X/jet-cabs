async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@carrental.com',
        password: 'Admin@123'
      })
    });
    const data = await res.json();
    const token = data.token;
    
    try {
      const res2 = await fetch('http://localhost:5000/api/cars', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: new FormData()
      });
      const data2 = await res2.json();
      console.log("Error response data:", data2);
    } catch (err) {
      console.log("Cars error:", err.message);
    }
  } catch (err) {
    console.log("Login error:", err.message);
  }
}

test();
