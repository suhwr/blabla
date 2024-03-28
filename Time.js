const time = document.getElementById('time');

function updateTime() {
  const now = Date.now();
  const date = new Date(now);
  const hours = date.getHours().toString().padStart(2, '0'); // Add leading zero for single digits
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  time.textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateTime, 1000);
