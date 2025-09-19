import torch
import numpy as np
from typing import Dict, List, Tuple
import cv2

class ObjectDetector:
    def __init__(self):
        self.model = None
        # Define prohibited items
        self.prohibited_items = [
            'cell phone', 'laptop', 'book', 'remote', 'keyboard',
            'mouse', 'tablet', 'tv', 'monitor'
        ]
        
        # Detection thresholds
        self.confidence_threshold = 0.3
        self.violation_history: List[Dict] = []
        self.history_size = 30

    def _preprocess_frame(self, frame: np.ndarray) -> torch.Tensor:
        """Preprocess frame for YOLOv5"""
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return frame_rgb

    def _filter_detections(self, results) -> List[Dict]:
        """Filter detections to only include prohibited items"""
        detections = []
        
        # Process YOLOv5 results
        for *box, conf, cls in results.xyxy[0]:
            class_name = results.names[int(cls)]
            if class_name in self.prohibited_items and conf >= self.confidence_threshold:
                detections.append({
                    'class': class_name,
                    'confidence': float(conf),
                    'box': [float(x) for x in box]
                })
        
        return detections

    def _calculate_violation_severity(self, detections: List[Dict]) -> str:
        """Calculate violation severity based on detections"""
        if any(d['class'] in ['cell phone', 'laptop', 'tablet'] for d in detections if d['confidence'] > 0.5):
            return 'critical'  # Electronic devices detected
        if any(d['class'] in ['book', 'remote', 'keyboard', 'mouse'] for d in detections if d['confidence'] > 0.4):
            return 'high'  # Other prohibited items
        if any(d['class'] in ['tv', 'monitor'] for d in detections if d['confidence'] > 0.4):
            return 'medium'  # Display devices
        return 'low'

    def _ensure_model_loaded(self):
        if self.model is None:
            import torch
            self.model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

    def analyze_frame(self, frame: np.ndarray) -> Dict:
        self._ensure_model_loaded()
        """Analyze frame for prohibited objects"""
        try:
            # Preprocess frame
            processed_frame = self._preprocess_frame(frame)
            
            # Run inference
            results = self.model(processed_frame)
            
            # Filter and process detections
            detections = self._filter_detections(results)
            
            # Update violation history
            if detections:
                self.violation_history.append(detections)
                if len(self.violation_history) > self.history_size:
                    self.violation_history.pop(0)

            # Calculate metrics
            severity = self._calculate_violation_severity(detections)
            persistent_violations = self._check_persistent_violations()

            return {
                'status': 'violation' if detections else 'clear',
                'severity': severity if detections else 'none',
                'detections': detections,
                'persistent_violations': persistent_violations,
                'metrics': {
                    'total_objects': len(detections),
                    'highest_confidence': max([d['confidence'] for d in detections], default=0.0),
                    'violation_streak': len(self.violation_history)
                }
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'detections': [],
                'severity': 'none',
                'persistent_violations': [],
                'metrics': {
                    'total_objects': 0,
                    'highest_confidence': 0.0,
                    'violation_streak': 0
                }
            }

    def _check_persistent_violations(self) -> List[Dict]:
        """Check for objects that consistently appear in recent frames"""
        if not self.violation_history:
            return []

        # Count object occurrences
        object_counts = {}
        for frame_detections in self.violation_history:
            for detection in frame_detections:
                obj_class = detection['class']
                object_counts[obj_class] = object_counts.get(obj_class, 0) + 1

        # Identify persistent violations (present in >50% of recent frames)
        threshold = len(self.violation_history) * 0.5
        persistent = [
            {
                'object': obj_class,
                'frequency': count / len(self.violation_history)
            }
            for obj_class, count in object_counts.items()
            if count > threshold
        ]

        return sorted(persistent, key=lambda x: x['frequency'], reverse=True)

    def confidence_score(self, detections: list) -> float:
        # Dummy implementation for test
        if not detections:
            return 0.0
        return float(np.mean([d.get("confidence", 0.0) for d in detections]))

    def track(self, objects: list) -> list:
        raise NotImplementedError("track is not implemented for production use.")

    def detect(self, frame: np.ndarray):
        raise NotImplementedError("detect is not implemented for production use.")

    def reset_state(self):
        """Reset the detector's state"""
        self.violation_history.clear()
