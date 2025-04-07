from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

FILE_PATH = "data.json"

# 초기 기본 구조 정의 (숫자 키 사용)
DEFAULT_PACKET = {
    "stampInfo": {
        "1": False,
        "2": False,
        "3": False,
        "4": False,
        "5": False
    },
    "staffCheck": False
}

# 서버에서만 알고 있는 스탬프 인증 코드
VALID_CODES = {
    "1": "1001",
    "2": "1002",
    "3": "1003",
    "4": "1004",
    "5": "1005"
}

# 데이터 로딩
def load_all_data():
    if not os.path.exists(FILE_PATH):
        return {}
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except UnicodeDecodeError:
        with open(FILE_PATH, 'r', encoding='cp949') as f:
            return json.load(f)

# 데이터 저장
def save_all_data(data):
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 학번 등록 및 기존 정보 반환
@app.route('/upload', methods=['POST'])
def upload_data():
    data = request.get_json()
    student_id = data.get('studentId')

    if not student_id:
        return jsonify({"error": "No studentId received"}), 400

    all_data = load_all_data()

    # 예전 형식인 문자열이면 새 구조로 대체
    if isinstance(all_data.get(student_id), str):
        all_data[student_id] = DEFAULT_PACKET.copy()
        save_all_data(all_data)

    # 신규 등록
    if student_id not in all_data:
        all_data[student_id] = DEFAULT_PACKET.copy()
        save_all_data(all_data)

    return jsonify({
        "message": "데이터 반환",
        "studentId": student_id,
        "stampInfo": all_data[student_id]["stampInfo"],
        "staffCheck": all_data[student_id]["staffCheck"]
    }), 200

# 도장 상태 및 staffCheck 갱신
@app.route('/update', methods=['PATCH', 'OPTIONS'])
def update_stamp_info():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    student_id = data.get('studentId')
    new_stamp_info = data.get('stampInfo')
    staff_check = data.get('staffCheck')

    if not student_id or not isinstance(new_stamp_info, dict):
        return jsonify({"error": "Invalid request"}), 400

    all_data = load_all_data()

    if student_id not in all_data:
        return jsonify({"error": "Student ID not found"}), 404

    all_data[student_id]["stampInfo"] = new_stamp_info
    if isinstance(staff_check, bool):
        all_data[student_id]["staffCheck"] = staff_check

    save_all_data(all_data)

    return jsonify({
        "message": "업데이트 성공",
        "studentId": student_id
    }), 200

# 도장 코드 인증 요청 처리
@app.route('/verify', methods=['POST'])
def verify_stamp_code():
    data = request.get_json()
    student_id = data.get('studentId')
    stamp_number = data.get('stampNumber')
    input_code = data.get('code')

    if not (student_id and stamp_number and input_code):
        return jsonify({"valid": False}), 400

    correct_code = VALID_CODES.get(str(stamp_number))
    is_valid = (input_code == correct_code)

    return jsonify({"valid": is_valid})

@app.route('/download', methods=['GET'])
def download_data():
    if not os.path.exists(FILE_PATH):
        return jsonify({"error": "data.json not found"}), 404
    return send_file(FILE_PATH, as_attachment=True)

# 서버 실행
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host='0.0.0.0', port=port)
