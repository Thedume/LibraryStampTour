

// 초기 변수 선언 및 상태 관리
const stamps = document.querySelectorAll('.stamp');
const popup = document.getElementById('popup');
const graphicPopup = document.getElementById('graphic-popup');
const confirmButton = document.getElementById('confirm-button');
const studentIdInput = document.getElementById('student-id');
const stampName = document.getElementById('stamp-name');
const stampDescription = document.getElementById('stamp-description');
const staffPopup = document.getElementById('staff-popup');
let currentStamp = null;
let stampedCount = 0;
let studentIdEntered = false;
let confirmationCompleted = false; // '확인 완료' 상태를 추적
let explorationCompleted = false; // '탐험 완료' 상태를 추적
let staffCheckConfirmed = false;

const BASE_URL = "https://librarystamptour.onrender.com";


// 도장 코드 및 이미지 설정
const stampImages = {
  1: {
    empty: 'https://i.postimg.cc/zfwq1ydV/0005-1.png', // 새로운 이미지 경로
    filled: 'https://i.postimg.cc/xJfBfjg7/0000-1.png'
  },
  2: {
    empty: 'https://i.postimg.cc/XpGm7zcV/0006-2.png',
    filled: 'https://i.postimg.cc/sQTqvFN2/0001-2.png'
  },
  3: {
    empty: 'https://i.postimg.cc/9r6S4YJy/0007-3.png',
    filled: 'https://i.postimg.cc/XBXh52Rk/0002-3.png'
  },
  4: {
    empty: 'https://i.postimg.cc/k2WHWRpz/0008-4.png',
    filled: 'https://i.postimg.cc/fkb11LVS/0003-4.png'
  },
  5: {
    empty: 'https://i.postimg.cc/HJHhzsGx/0009-5.png',
    filled: 'https://i.postimg.cc/PNF0HjD3/0004-5.png'
  }
};

// 🔹 서버로 학번을 전송하고 studentId만 반환하는 함수


// 서버 통신 함수
async function fetchStudentId(studentId) {
  try {
    const response = await fetch('${BASE_URL}/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId }),
    });

    const data = await response.json();
    return data.studentId || null;

  } catch (error) {
    console.error('fetchStudentId 오류:', error);
    return null;
  }
}

// 🔹 서버로 학번을 전송하고 stampInfo만 반환하는 함수
async function fetchStampInfo(studentId) {
  try {
    const response = await fetch('${BASE_URL}/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId }),
    });

    const data = await response.json();
    staffCheckConfirmed = data.staffCheck || false;
    return data.stampInfo || null;

  } catch (error) {
    console.error('fetchStampInfo 오류:', error);
    return null;
  }
}

// 🔹 서버로 받은 stampInfo를 기반으로 도장 UI 상태 복원


// 도장 상태 적용 및 복원
function applyStampInfo(stampInfo) {
  for (const [stampNumber, isStamped] of Object.entries(stampInfo)) {
    if (isStamped) {
      const stampElement = document.querySelector(`.stamp[data-stamp="${stampNumber.replace('번', '')}"]`);
      if (stampElement && !stampElement.classList.contains('stamped')) {
        const imgElement = stampElement.querySelector('img');
        imgElement.setAttribute('src', stampImages[stampNumber.replace('번', '')].filled);
        stampElement.classList.add('stamped');
        stampedCount++;
      }
    }
  }
  updateConfirmButton(); // 버튼 상태도 반영
}

async function updateStampInfo(studentId, stampInfo, staffCheck = null) {
  const body = { studentId, stampInfo };
  if (staffCheck !== null) {
    body.staffCheck = staffCheck;
  }

  try {
    const response = await fetch('${BASE_URL}/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('서버 업데이트 응답:', data);
    return data;

  } catch (error) {
    console.error('도장 정보 업데이트 실패:', error);
    return null;
  }
}






// 학번 제출 처리
document.getElementById('submit-id-btn').addEventListener('click', async () => {
  const studentId = studentIdInput.value.trim();
  const studentIdPattern = /^(k\d+|\d+)$/i;

  if (!studentIdPattern.test(studentId)) {
    alert('학번은 숫자 또는 "k+숫자" 형식이어야 합니다.');
    return;
  }

  studentIdEntered = true;

  // for Debug
  console.log("보내는 studentId:", studentId);

  // 🔸 서버로부터 studentId 및 stampInfo 요청
  const receivedId = await fetchStudentId(studentId);
  const stampInfo = await fetchStampInfo(studentId);

  if (!receivedId || !stampInfo) {
    alert('서버와 통신 실패');
    return;
  }

  // ✅ 입력창 비활성화 및 환영 메시지 출력
  studentIdInput.disabled = true;
  document.getElementById('submit-id-btn').disabled = true;
  studentIdInput.style.display = 'none';
  document.getElementById('submit-id-btn').style.display = 'none';

  const inputSection = document.querySelector('.input-section');
  const welcomeMsg = document.createElement('div');
  welcomeMsg.style.color = 'white';
  welcomeMsg.style.fontSize = '1.2rem';
  welcomeMsg.style.marginTop = '10px';
  welcomeMsg.textContent = `${receivedId}번 탐험가님 환영합니다!`;
  inputSection.appendChild(welcomeMsg);

  // 🔸 stampInfo로 도장 UI 복원할 수도 있음 (원할 경우 추가)
  console.log('도장 상태:', stampInfo);

  // 🔸 stampInfo로 도장 UI 복원
  applyStampInfo(stampInfo);


});



// 팝업 열기 함수


// 도장 팝업 처리
function openPopup(name, description, stampElement) {
  stampName.textContent = name;
  stampDescription.textContent = description;
  popup.classList.add('active');
  currentStamp = stampElement;
}

// 팝업 닫기 함수
function closePopup() {
  popup.classList.remove('active');
  currentStamp = null;
}

// 도장 클릭 이벤트
stamps.forEach(stamp => {
  stamp.addEventListener('click', () => {
    if (!studentIdEntered) {
      showGraphicPopup('학번을 입력해주세요!', 3000);
      return;
    }

    // 도장이 이미 찍힌 경우 클릭 불가
    if (stamp.classList.contains('stamped')) {
      showGraphicPopup('이미 찍힌 도장입니다!', 3000);
      return;
    }

    const stampNumber = stamp.getAttribute('data-stamp');

    // 팝업 열기
    openPopup(`도장 ${stampNumber}`, `도장 ${stampNumber}에 대한 설명입니다.`, stamp);
  });
});



// 도장 코드 제출 처리
async function submitCode() {
  const code = document.getElementById('stamp-code').value.trim();
  if (!currentStamp) return alert('도장을 선택해주세요!');

  const stampNumber = currentStamp.getAttribute('data-stamp');
  const studentId = studentIdInput.value.trim();

  const response = await fetch('${BASE_URL}/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, stampNumber, code })
  });

  const result = await response.json();

  if (result.valid) {
    const imgElement = currentStamp.querySelector('img');
    if (!currentStamp.classList.contains('stamped')) {
      imgElement.setAttribute('src', stampImages[stampNumber].filled);
      currentStamp.classList.add('stamped');
      stampedCount++;
      updateConfirmButton();
    }

    closePopup();

    // 도장 상태 업데이트
    const stampInfo = {};
    document.querySelectorAll('.stamp').forEach(stamp => {
      const num = stamp.getAttribute('data-stamp');
      stampInfo[num] = stamp.classList.contains('stamped');
    });

    await updateStampInfo(studentId, stampInfo);
    showGraphicPopup(`도장 ${stampNumber} 인증 완료!`, 3000);

  } else {
    alert('잘못된 코드입니다.');
  }
}


// 직원 확인 코드 제출 처리
async function submitStaffCode() {
  const code = document.getElementById('staff-code').value.trim();
  if (code === '8041') {
    confirmationCompleted = true;
    staffCheckConfirmed = true;  // ✅ 전역 상태에도 반영
    closeStaffPopup();

    // 도장 상태 업데이트
    const stampInfo = {};
    document.querySelectorAll('.stamp').forEach(stamp => {
      const num = stamp.getAttribute('data-stamp');
      stampInfo[num] = stamp.classList.contains('stamped');
    });

    // 서버에 staffCheck도 함께 전송
    await updateStampInfo(studentIdInput.value.trim(), stampInfo, true);

    updateConfirmButton();  // 이 안에서 setExplorationCompleted 호출됨
    showGraphicPopup('탐험 완료 확인 후에도 도장을 더 모을 수 있습니다!', 2500);
  } else {
    alert('잘못된 코드입니다.');
  }
}


// 확인 버튼 상태 업데이트


// 확인 버튼 관련 처리
function updateConfirmButton() {
  if (explorationCompleted) return;

  if (stampedCount === 5 && (confirmationCompleted || staffCheckConfirmed)) {
    // 도장 5개 + 직원 확인 or 사전 인증
    setExplorationCompleted();
  } 
  else if (stampedCount >= 3 && (confirmationCompleted || staffCheckConfirmed)) {
    // 도장 3개 이상이고 직원 확인 되었으면 확인 완료만
    confirmButton.textContent = '탐험 완료';
    confirmButton.classList.remove('disabled');
    confirmButton.classList.add('completed');
    confirmButton.style.backgroundColor = '#dc3545';
    confirmButton.style.color = 'white';
    confirmButton.onclick = null;
  }
  else if (stampedCount >= 3) {
    // 일반적인 확인 가능 조건
    confirmButton.textContent = '확인 가능';
    confirmButton.classList.remove('disabled');
    confirmButton.classList.add('enabled');
    confirmButton.onclick = handleConfirmButtonClick;

    showGraphicPopup('탐험 완료 조건을 만족하셨군요! 도서관으로 가서 탐험 완료 확인을 받으세요!', 2500);
  } 
  else {
    confirmButton.textContent = '확인 불가';
    confirmButton.classList.add('disabled');
    confirmButton.classList.remove('enabled');
    confirmButton.onclick = null;
  }
}



// 확인 버튼 클릭 처리
function handleConfirmButtonClick() {
  if (stampedCount === 5 && (confirmationCompleted || staffCheckConfirmed)) {
    // ✅ 도장 5개 찍혔고, staffCheck 또는 직원 확인 완료 시
    setExplorationCompleted();
  } else {
    openStaffPopup();
  }
}

// 탐험 완료 상태 설정
function setExplorationCompleted() {
  confirmButton.textContent = '🚩도서관 정복🚩';
  confirmButton.classList.remove('enabled');
  confirmButton.classList.add('completed');
  confirmButton.style.backgroundColor = '#ffc107'; // 노란색으로 변경
  confirmButton.style.color = '#000'; // 텍스트 색상 검정으로 변경
  confirmButton.onclick = null; // 버튼 클릭 비활성화
  explorationCompleted = true; // 탐험 완료 상태로 설정

  // 그래픽 팝업 출력
  showGraphicPopup('탐험자님은 이제 도서관을 정복하셨군요. 탐험은 즐거우셨나요? 앞으로도 많이 놀러와주세요!', 3000);
}

// 직원 확인 팝업 열기


// 팝업 및 메시지 UI 처리
function openStaffPopup() {
  staffPopup.classList.add('active');
}

// 직원 확인 팝업 닫기
function closeStaffPopup() {
  staffPopup.classList.remove('active');
}


// 그래픽 팝업 표시
function showGraphicPopup(message, duration = 3000) {
  graphicPopup.textContent = message;
  graphicPopup.classList.add('active');
  setTimeout(() => {
    graphicPopup.classList.remove('active');
  }, duration);
}



// 문서 로드 후 초기 이벤트 설정
document.addEventListener('DOMContentLoaded', () => {
  const submitStampCodeBtn = document.getElementById('submit-stamp-code');
  if (submitStampCodeBtn) {
    submitStampCodeBtn.addEventListener('click', submitCode);
  }
});