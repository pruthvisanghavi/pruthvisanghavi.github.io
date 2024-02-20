let currentIndex = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function showSlide(index) {
  const newPosition = -index * 100 + '%';
  document.querySelector('.slider').style.transform = 'translateX(' + newPosition + ')';
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % totalSlides;
  showSlide(currentIndex);
}

setInterval(nextSlide, 3000); // Change slide every 3000 milliseconds (3 seconds)