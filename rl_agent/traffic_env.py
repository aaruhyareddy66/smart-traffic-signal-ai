import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random

class TrafficEnv(gym.Env):
    def __init__(self):
        super().__init__()
        self.observation_space = spaces.Box(low=0, high=100, shape=(5,), dtype=np.float32)
        self.action_space = spaces.Discrete(2)
        self.current_phase = 0
        self.step_count = 0
        self.max_steps = 500
        self.vehicle_counts = [0, 0, 0, 0]

    def _generate_traffic(self):
        return [random.randint(5, 50) for _ in range(4)]

    def _get_obs(self):
        return np.array(self.vehicle_counts + [self.current_phase], dtype=np.float32)

    def _get_reward(self):
        if self.current_phase == 0:
            moving = self.vehicle_counts[0] + self.vehicle_counts[1]
            waiting = self.vehicle_counts[2] + self.vehicle_counts[3]
        else:
            moving = self.vehicle_counts[2] + self.vehicle_counts[3]
            waiting = self.vehicle_counts[0] + self.vehicle_counts[1]
        return float(moving - waiting)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_phase = 0
        self.step_count = 0
        self.vehicle_counts = self._generate_traffic()
        return self._get_obs(), {}

    def step(self, action):
        if action == 1:
            self.current_phase = 1 - self.current_phase
        self.vehicle_counts = self._generate_traffic()
        obs = self._get_obs()
        reward = self._get_reward()
        self.step_count += 1
        done = self.step_count >= self.max_steps
        return obs, reward, done, False, {}

    def close(self):
        pass