from ultralytics import YOLO
import cv2

model = YOLO("yolov8n.pt")

VEHICLE_CLASSES = [2, 3, 5, 7]

def count_vehicles_from_frame(frame):
    results = model(frame, verbose=False)[0]
    count = 0
    annotated = frame.copy()
    for box in results.boxes:
        cls = int(box.cls[0])
        if cls in VEHICLE_CLASSES:
            count += 1
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, "Vehicle", (x1, y1-5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    return count, annotated

def count_from_video(video_path):
    cap = cv2.VideoCapture(video_path)
    total = 0
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % 10 == 0:
            count, _ = count_vehicles_from_frame(frame)
            total = max(total, count)
        frame_count += 1
    cap.release()
    return total

if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        count, annotated = count_vehicles_from_frame(frame)
        cv2.putText(annotated, f"Vehicles: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.imshow("Traffic Detection", annotated)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()