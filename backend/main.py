import shutil
from fastapi import UploadFile, File

@app.post("/upload_video")
async def upload_video(file: UploadFile = File(...)):
    try:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "yolo_module")))
        from detect import count_from_video
        count = count_from_video(temp_path)
        os.remove(temp_path)
        counts = [count, max(0,count-5), max(0,count-10), max(0,count-3)]
        action = get_signal_decision(counts)
        max_count = max(counts)
        green_time = round(10 + max_count * 0.5)
        return {
            "north": counts[0], "south": counts[1],
            "east": counts[2], "west": counts[3],
            "active_phase": "North-South" if action == 0 else "East-West",
            "green_time": green_time,
            "total_vehicles": count
        }
    except Exception as e:
        return {"error": str(e)}