import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from stable_baselines3 import DQN
from stable_baselines3.common.env_checker import check_env
from traffic_env import TrafficEnv

env = TrafficEnv()
check_env(env, warn=True)

model = DQN(
    "MlpPolicy",
    env,
    verbose=1,
    learning_rate=1e-3,
    buffer_size=10000,
    batch_size=64,
    gamma=0.95,
    exploration_fraction=0.2,
    exploration_final_eps=0.05,
    train_freq=4,
    target_update_interval=100,
)

print("Training started...")
model.learn(total_timesteps=20000)
os.makedirs("models", exist_ok=True)
model.save("models/traffic_dqn")
print("Model saved!")
env.close()