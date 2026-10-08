// Choose a different menu backdrop on each fresh page load.
(function chooseMenuBackground() {
  var background = document.getElementById('background-image');
  if (!background) return;
  var file = Math.random() < 0.5 ? 'menubackground.png' : 'menubackground2.png';
  background.style.backgroundImage = "url('images/" + file + "')";
})();

function startBackgroundMusic() {
  var music = document.getElementById('background-music');
  if (!music.paused) return;
  var playback = music.play();
  if (playback) playback.catch(function() { /* Retry on the next user interaction. */ });
}
document.addEventListener('pointerdown', startBackgroundMusic);
document.addEventListener('keydown', startBackgroundMusic);
document.getElementById('start-game').addEventListener('click', function () {
  startBackgroundMusic();
  document.body.classList.remove('menu-screen');
  document.getElementById('background-image').classList.add('opacity30');
  document.getElementById('game-title').classList.add('hiding');
  document.getElementById('game-subtitle').classList.add('hidden');
  document.getElementById('menu').classList.add('hidden');

  document.getElementById('loading').classList.remove('hidden');
  setTimeout(function () {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('recaptcha').classList.remove('hidden');
  }, 800);
});

// 人机验证：复选框，询问用户是否是机器人
document.getElementById('not-robot-checkbox').addEventListener('change', function () {
  var card = document.querySelector('.recaptcha-container');
  if (card.dataset.state !== 'idle') return;
  this.disabled = true;
  card.dataset.state = 'checking';
  card.setAttribute('aria-busy', 'true');
  var status = document.getElementById('verification-status');
  status.textContent = 'Verifying…';
  setTimeout(function () {
    card.dataset.state = 'verified';
    card.setAttribute('aria-busy', 'false');
    status.textContent = 'Verified';
    setTimeout(function () {
      document.getElementById('recaptcha').classList.add('hidden');
      document.getElementById('text-captcha').classList.remove('hidden');
      document.getElementById('text-captcha-input').focus();
    }, 500);
  }, 900);
});

// 文字输入captcha
document.getElementById('text-captcha-form').addEventListener('submit', function (event) {
  event.preventDefault();
  var userInput = document.getElementById('text-captcha-input').value;
  if (userInput.toLowerCase() === 'easy captcha') {
    var loadingElement = document.getElementById('loading');
    document.getElementById('text-captcha').classList.add('hidden');
    loadingElement.classList.remove('hidden');
    setTimeout(function () {
      loadingElement.classList.add('hidden');
      document.getElementById('slider-captcha').classList.remove('hidden');
    }, 800);
  } else {
    document.getElementById('text-captcha-input').value = '';
    document.getElementById('text-status').textContent = 'Incorrect. Please try again.';
    document.getElementById('text-captcha-input').focus();
    shakeChallenge('text-captcha');
  }    
});

// Sliding puzzle. Position is stored in the original image's 630px coordinates.
var puzzleCard = document.getElementById('slider-captcha');
var sliderCaptchaControl = document.getElementById('slider-captcha-control');
var sliderCaptchaHandle = document.getElementById('slider-captcha-handle');
var sliderCaptchaPiece = document.getElementById('slider-captcha-piece');
var puzzleRail = document.getElementById('puzzle-slider');
var puzzleStatus = document.getElementById('puzzle-status');
var puzzleState = 'idle';
var activePointer = null;
var dragStartX = 0;
var pieceStartX = 0;
var piecePosition = 0;
var correctPosition = 265;
var tolerance = 8;
var pieceTravel = 630 - 138;

function setPuzzlePosition(position) {
  piecePosition = Math.max(0, Math.min(position, pieceTravel));
  var progress = piecePosition / pieceTravel;
  sliderCaptchaPiece.style.left = (piecePosition / 630 * 100) + '%';
  sliderCaptchaHandle.style.left = (progress * (puzzleRail.clientWidth - sliderCaptchaHandle.offsetWidth)) + 'px';
  sliderCaptchaHandle.setAttribute('aria-valuenow', Math.round(progress * 100));
}
function resetSliderCaptcha() { setPuzzlePosition(0); }
function failPuzzle() {
  puzzleState = 'resetting';
  puzzleStatus.textContent = 'Not quite. Try again.';
  puzzleCard.classList.add('shake', 'is-resetting');
  resetSliderCaptcha();
  setTimeout(function () {
    puzzleCard.classList.remove('shake', 'is-resetting');
    puzzleState = 'idle';
  }, 500);
}
function verifyPuzzle() {
  if (Math.abs(piecePosition - correctPosition) > tolerance) { failPuzzle(); return; }
  puzzleState = 'verified';
  sliderCaptchaHandle.disabled = true;
  puzzleStatus.textContent = '';
  document.getElementById('puzzle-loading').classList.remove('hidden');
  setTimeout(function () {
    document.getElementById('puzzle-loading').classList.add('hidden');
    document.getElementById('puzzle-taunt').classList.remove('hidden');
    document.getElementById('puzzle-taunt').focus();
  }, 800);
}
sliderCaptchaHandle.addEventListener('pointerdown', function (e) {
  if (puzzleState !== 'idle' || e.button !== 0 || e.isPrimary === false) return;
  e.preventDefault();
  puzzleState = 'dragging';
  puzzleStatus.textContent = '';
  activePointer = e.pointerId;
  dragStartX = e.clientX;
  pieceStartX = piecePosition;
  sliderCaptchaHandle.setPointerCapture(e.pointerId);
});
function movePuzzle(e) {
  if (puzzleState !== 'dragging' || e.pointerId !== activePointer) return;
  var travel = puzzleRail.clientWidth - sliderCaptchaHandle.offsetWidth;
  if (travel > 0) setPuzzlePosition(pieceStartX + (e.clientX - dragStartX) / travel * pieceTravel);
}
sliderCaptchaHandle.addEventListener('pointermove', movePuzzle);
sliderCaptchaHandle.addEventListener('pointerup', function (e) {
  if (puzzleState !== 'dragging' || e.pointerId !== activePointer) return;
  movePuzzle(e);
  activePointer = null;
  puzzleState = 'idle';
  if (sliderCaptchaHandle.hasPointerCapture(e.pointerId)) sliderCaptchaHandle.releasePointerCapture(e.pointerId);
  verifyPuzzle();
});
function cancelPuzzleDrag(e) {
  if (puzzleState !== 'dragging' || e.pointerId !== activePointer) return;
  activePointer = null;
  puzzleState = 'idle';
  resetSliderCaptcha();
}
sliderCaptchaHandle.addEventListener('pointercancel', cancelPuzzleDrag);
sliderCaptchaHandle.addEventListener('lostpointercapture', cancelPuzzleDrag);
sliderCaptchaHandle.addEventListener('keydown', function (e) {
  if (puzzleState !== 'idle') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    setPuzzlePosition(piecePosition + (e.key === 'ArrowRight' ? 5 : -5));
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); verifyPuzzle();
  }
});
window.addEventListener('resize', function () {
  if (puzzleState === 'dragging') { puzzleState = 'idle'; activePointer = null; resetSliderCaptcha(); }
  else setPuzzlePosition(piecePosition);
});
document.getElementById('puzzle-taunt').addEventListener('click', function () {
  this.classList.add('hidden');
  puzzleCard.classList.add('hidden');
  document.getElementById('image-select-captcha').classList.remove('hidden');
});

function shakeChallenge(id) {
  var card = document.getElementById(id);
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  card.onanimationend = function(e) {
    if (e.target === card) card.classList.remove('shake');
  };
}

// 对于验证码图片
var captchaImages = document.getElementsByClassName('captcha-img');
var wallyLocked = false;
for (var i = 0; i < captchaImages.length; i++) {
  captchaImages[i].parentElement.addEventListener('click', function() {
    if (wallyLocked) return;
    this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') !== 'true');
    document.getElementById('wally-status').textContent = '';
  });
}

// 添加点击事件监听器到"Next"按钮
document.getElementById('verify-wally').addEventListener('click', function () {
  if (wallyLocked) return;
  var correctImageChosen = false; // 假设初始时没有选中正确图片
  var totalImagesChosen = 0; // 计算被选中的图片数量

  for (var i = 0; i < captchaImages.length; i++) {
    // 检查是否已经选择了正确的图片（例如，判断图片的透明度是否为0.7，URL是否为images/male1.png）
    if (captchaImages[i].parentElement.getAttribute('aria-pressed') === 'true') {
      totalImagesChosen++;
      if (captchaImages[i].src.includes('images/male1.png')) {
        correctImageChosen = true;
      }
    }
  }

  if (correctImageChosen && totalImagesChosen == 1) {
    wallyLocked = true;
    this.disabled = true;
    // 如果只选择了正确的图片，隐藏图片选择验证码，并显示旋转验证码
    document.getElementById('image-select-captcha').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    setTimeout(function () {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('rotate-captcha').classList.remove('hidden');
    }, 800);
  } else {
    // 如果没有选择正确的图片，清除所有选择，并给出提示（可选）
    for (var i = 0; i < captchaImages.length; i++) {
      captchaImages[i].parentElement.setAttribute('aria-pressed', 'false');
    }
    document.getElementById('wally-status').textContent = 'Please try again.';
    shakeChallenge('image-select-captcha');
  }
});

// 旋转验证码
var rotateCaptchaImage = document.getElementById('rotate-captcha-img');
var rotateCaptchaDegree = 40;
var rotationTarget = Math.random() < .5 ? 0 : 180;
var rotationHandle = document.getElementById('rotation-handle');
var rotationTrack = document.getElementById('rotation-track');
var rotationStatus = document.getElementById('rotation-status');
var rotationPointer = null;
var rotationVelocity = 0;
var rotationFrame = 0;
var rotationLastFrame = 0;
var rotationInput = 0;
var rotationStartX = 0;
var rotationLocked = false;
var rotationReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function drawRotation() { rotateCaptchaImage.style.transform = 'rotate(' + rotateCaptchaDegree + 'deg)'; }
function rotationDistance(a, b) { return Math.abs(((a - b) % 360 + 540) % 360 - 180); }
function stopRotation() {
  cancelAnimationFrame(rotationFrame);
  rotationFrame = 0;
  rotationVelocity = 0;
}
function coastRotation(time) {
  var dt = Math.min((time - rotationLastFrame) / 1000, .05);
  rotationLastFrame = time;
  if (rotationPointer !== null) {
    var desired = (rotationReducedMotion ? 180 : 1080) * Math.pow(rotationInput, 2.2);
    var response = Math.exp(-10 * dt);
    rotateCaptchaDegree += desired * dt + (rotationVelocity - desired) * (1 - response) / 10;
    rotationVelocity = desired + (rotationVelocity - desired) * response;
  } else {
    var decay = Math.exp(-2.2 * dt);
    rotateCaptchaDegree += rotationVelocity * (1 - decay) / 2.2;
    rotationVelocity *= decay;
  }
  drawRotation();
  if ((rotationPointer !== null || Math.abs(rotationVelocity) > .1) && !document.hidden) rotationFrame = requestAnimationFrame(coastRotation);
  else { stopRotation(); rotateCaptchaDegree = (rotateCaptchaDegree % 360 + 360) % 360; drawRotation(); }
}
drawRotation();
rotationHandle.addEventListener('pointerdown', function(e) {
  if (rotationLocked || rotationPointer !== null || e.button !== 0 || e.isPrimary === false) return;
  e.preventDefault(); stopRotation();
  rotationHandle.classList.remove('returning');
  rotationHandle.style.left = '0px';
  rotationPointer = e.pointerId;
  rotationStartX = e.clientX;
  rotationInput = 0;
  rotationLastFrame = performance.now();
  rotationHandle.setPointerCapture(e.pointerId);
  rotationFrame = requestAnimationFrame(coastRotation);
});
rotationHandle.addEventListener('pointermove', function(e) {
  if (e.pointerId !== rotationPointer) return;
  var travel = Math.max(1, rotationTrack.clientWidth - rotationHandle.offsetWidth);
  var x = Math.max(0, Math.min(travel, e.clientX - rotationStartX));
  rotationInput = x / travel;
  rotationHandle.style.left = x + 'px';
});
function releaseRotation(e) {
  if (e.pointerId !== rotationPointer) return;
  rotationPointer = null;
  rotationInput = 0;
  if (rotationHandle.hasPointerCapture(e.pointerId)) rotationHandle.releasePointerCapture(e.pointerId);
  rotationHandle.classList.add('returning');
  rotationHandle.style.left = '0px';
  if (e.type !== 'pointerup' || rotationReducedMotion) { stopRotation(); return; }
  // The existing animation loop continues into inertia; do not start a second loop.
}
rotationHandle.addEventListener('pointerup', releaseRotation);
rotationHandle.addEventListener('pointercancel', releaseRotation);
rotationHandle.addEventListener('lostpointercapture', releaseRotation);
rotationHandle.addEventListener('keydown', function(e) {
  if (rotationLocked || rotationPointer !== null || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault(); stopRotation();
  rotateCaptchaDegree += e.key === 'ArrowRight' ? 2 : -2;
  drawRotation();
});
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) return;
  if (rotationPointer !== null) releaseRotation({pointerId: rotationPointer, type: 'pointercancel'});
  stopRotation();
});

document.getElementById('rotate-next-btn').addEventListener('click', function() {
  if (rotationLocked || rotationPointer !== null) return;
  // Evaluate the visible angle at the moment VERIFY is clicked, even while coasting.
  if (rotationDistance(rotateCaptchaDegree, rotationTarget) <= 3) {
    rotationLocked = true;
    stopRotation();
    this.disabled = true;
    rotationHandle.disabled = true;
    var loadingElement = document.getElementById('loading');
    document.getElementById('rotate-captcha').classList.add('hidden');
    loadingElement.classList.remove('hidden');
    setTimeout(function () {
      loadingElement.classList.add('hidden');
      document.getElementById('voice-captcha').classList.remove('hidden');
    }, 800);
  } else {
    if (rotationDistance(rotateCaptchaDegree, (rotationTarget + 180) % 360) <= 3) {
      rotationStatus.textContent = 'Incorrect. The machine has chosen another up.';
    } else {
      rotationStatus.textContent = 'Incorrect. Please try again.';
    }
    // 如果图片没有旋转到正确的方向，提示用户继续旋转图片
    shakeChallenge('rotate-captcha');
  }
});

// 语音输入captcha
var voiceVerified = false;
document.getElementById('voice-captcha-form').addEventListener('submit', function (event) {
  event.preventDefault();
  if (voiceVerified) return;
  var userInput = document.getElementById('voice-captcha-input').value;
  if (userInput.toLowerCase() === "you can't pass") {
    voiceVerified = true;
    document.getElementById('submit-voice-captcha').disabled = true;
    document.getElementById('captcha-audio').pause();
    var loadingElement = document.getElementById('loading');
    document.getElementById('voice-captcha').classList.add('hidden');
    loadingElement.classList.remove('hidden');
    setTimeout(function () {
      loadingElement.classList.add('hidden');
      document.getElementById('math-captcha').classList.remove('hidden');
    }, 800);
  } else {
    document.getElementById('voice-captcha-input').value = '';
    document.getElementById('voice-status').textContent = 'Please try again.';
    document.getElementById('voice-captcha-input').focus();
    document.getElementById('voice-captcha').classList.add('shake');
    setTimeout(function () {
      document.getElementById('voice-captcha').classList.remove('shake');
    }, 820);
  }    
});

// 道德难题captcha
var trolleyVerified = false;
var trolleyBusy = false;
var trolleyAttempts = 0;
document.querySelectorAll('.trolleyOption').forEach(function(button) {
  button.addEventListener('click', function() {
    if (trolleyVerified || trolleyBusy) return;
    trolleyBusy = true;
    trolleyAttempts++;
    var choice = this.id;
    var status = document.getElementById('trolley-status');
    status.className = 'is-checking';
    status.textContent = 'Evaluating your decision…';
    document.querySelectorAll('.trolleyOption').forEach(function(b) { b.disabled = true; });
    setTimeout(function () {
      if (trolleyAttempts === 1) {
        status.className = 'is-error';
        status.textContent = choice === 'option1' ? 'Incorrect. You allowed five people to die.' : 'Incorrect. You chose to kill a person.';
        shakeChallenge('trolley-captcha');
        trolleyBusy = false;
        document.querySelectorAll('.trolleyOption').forEach(function(b) { b.disabled = false; });
        return;
      }
      trolleyVerified = true;
      status.className = 'is-success';
      status.textContent = 'Moral consistency verified.';
      setTimeout(function() {
        document.getElementById('trolley-captcha').classList.add('hidden');
        document.getElementById('loading').classList.remove('hidden');
        setTimeout(function() {
          document.getElementById('loading').classList.add('hidden');
          document.getElementById('bomb-captcha').classList.remove('hidden');
          startBombCaptchaCountdown();
        }, 800);
      }, 1400);
    }, 1000);
  });
});

// 数学captcha
var mathVerified = false;
document.getElementById('math-captcha-form').addEventListener('submit', function (event) {
  event.preventDefault();
  if (mathVerified) return;
  var userInput = document.getElementById('math-captcha-input').value;
  if (userInput === '3') {
    mathVerified = true;
    document.getElementById('submit-math-captcha').disabled = true;
    var loadingElement = document.getElementById('loading');
    document.getElementById('math-captcha').classList.add('hidden');
    loadingElement.classList.remove('hidden');
    setTimeout(function () {
      loadingElement.classList.add('hidden');
      document.getElementById('trolley-captcha').classList.remove('hidden');

    }, 800);
  } else {
    document.getElementById('math-captcha-input').value = '';
    document.getElementById('math-status').textContent = 'Please try again.';
    document.getElementById('math-captcha-input').focus();
    shakeChallenge('math-captcha');
  }    
});

// Seven-segment clock drawn locally; no font downloads required.
function renderBombClock(seconds) {
  var clock = document.getElementById('countdown');
  var value = '00:' + String(seconds).padStart(2, '0');
  if (clock.dataset.value === value) return;
  clock.dataset.value = value;
  clock.setAttribute('aria-label', seconds + ' seconds remaining');
  var patterns = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  var segments = ['8,2 32,2 36,6 32,10 8,10 4,6', '33,11 37,7 37,31 33,35 29,31 29,15', '33,37 37,41 37,65 33,69 29,61 29,41', '8,64 28,64 32,68 28,72 8,72 4,68', '3,37 7,41 7,61 3,65 0,61 0,41', '3,11 7,15 7,31 3,35 0,31 0,15', '8,33 28,33 32,37 28,41 8,41 4,37'];
  clock.innerHTML = Array.from(value).map(function(char) {
    if (char === ':') return '<svg class="clock-colon" viewBox="0 0 12 74" aria-hidden="true"><circle cx="6" cy="25" r="3"/><circle cx="6" cy="51" r="3"/></svg>';
    return '<svg viewBox="0 0 40 74" aria-hidden="true">' + segments.map(function(points, i) {
      return '<polygon points="' + points + '" opacity="' + (patterns[Number(char)].includes('abcdefg'[i]) ? '1' : '.08') + '"/>';
    }).join('') + '</svg>';
  }).join('');
}
var bombStarted = false;
function startBombCaptchaCountdown() {
  if (bombStarted) return;
  bombStarted = true;
  var wireIds = ['red-wire', 'yellow-wire', 'blue-wire', 'green-wire'];
  var correctWireId = wireIds[Math.floor(Math.random() * wireIds.length)];
  var card = document.getElementById('bomb-captcha');
  var status = document.getElementById('bomb-status');
  var deadline = performance.now() + 6000;
  var finished = false;
  var timer;
  function finish(success, expired) {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    wireIds.forEach(function(id) { document.getElementById(id).disabled = true; });
    card.classList.remove('is-urgent');
    card.classList.add(success ? 'is-defused' : 'is-exploded');
    status.textContent = success ? 'Bomb defused. You saved yourself.' : expired ? 'Time’s up. The bomb exploded.' : 'Incorrect. The bomb exploded.';
    setTimeout(function() {
      if (success) { window.location.href = 'https://wangzeyu.vercel.app/'; return; }
      card.classList.add('hidden');
      document.getElementById('loading').classList.remove('hidden');
      setTimeout(function() {
        var restart = new URL(window.location.href);
        restart.searchParams.delete('testLevel');
        restart.searchParams.set('restart', '1');
        window.location.href = restart.href;
      }, 800);
    }, 1500);
  }
  function tick() {
    if (finished) return;
    var remaining = Math.max(0, deadline - performance.now());
    renderBombClock(Math.ceil(remaining / 1000));
    card.classList.add('is-urgent');
    if (remaining <= 0) finish(false, true);
  }
  wireIds.forEach(function(id) {
    document.getElementById(id).onclick = function() {
      if (finished) return;
      if (performance.now() >= deadline) { renderBombClock(0); finish(false, true); return; }
      tick();
      finish(id === correctWireId, false);
    };
  });
  tick();
  timer = setInterval(tick, 50);
}

// A fresh page load resets every challenge after a failed bomb attempt.
(function resumeAfterFailure() {
  var levels = ['recaptcha', 'text-captcha', 'slider-captcha', 'image-select-captcha', 'rotate-captcha', 'voice-captcha', 'math-captcha', 'trolley-captcha', 'bomb-captcha'];
  var url = new URL(window.location.href);
  if (url.searchParams.get('restart') === '1') {
    document.body.classList.remove('menu-screen');
    document.getElementById('background-image').classList.add('opacity30');
    ['game-title', 'game-subtitle', 'menu', 'loading'].concat(levels).forEach(function(id) { document.getElementById(id).classList.add('hidden'); });
    document.getElementById('recaptcha').classList.remove('hidden');
    startBackgroundMusic();
  }
})();
