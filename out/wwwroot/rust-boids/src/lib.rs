use std::vec;

use glam::Vec2;
use wasm_bindgen::prelude::*;

const MAX_SPEED: f32 = 6.0;
const MAX_FORCE: f32 = 0.9; //How sharp or smooth they turn

// Remove these lines - we'll calculate grid dynamically
// const COLS: usize = WIDTH / GRID_RESOLUTION;
// const ROWS: usize = HEIGHT / GRID_RESOLUTION;

///The "Boid" is the individual bird that when combined, creates a complex
/// flocking behaviour system
#[derive(PartialEq, Clone)]
struct Boid {
    position: Vec2,
    velocity: Vec2, //Velocity
    acceleration: Vec2,
    max_speed: f32, //Generation Speed
    max_force: f32, //Alignment / Cohesion / Separation
    width: f32,     // Store bounds in each boid
    height: f32,
    smoothed_acceleration: Vec2,
}

impl Boid {
    fn spawn(width: f32, height: f32) -> Self {  // Add parameters here
        Boid {
            position: Vec2::new(
                fastrand::f32() * width * 8.0,  
                fastrand::f32() * height * 8.0, 
            ),
            velocity: Vec2::new(
                (fastrand::f32() - 0.5) * 4.0, // Random velocity: -2.0 to 2.0
                (fastrand::f32() - 0.5) * 4.0,
            ),
            acceleration: Vec2::ZERO,
            max_speed: MAX_SPEED,
            max_force: MAX_FORCE,
            width,     // Use parameters
            height,    // Use parameters
            smoothed_acceleration: Vec2::ZERO,
        }
    }

    ///Each boid will self-manage according to separation/cohesion/alignment rules
    fn run_with_delta(&mut self, boids: &Vec<Boid>, delta_time: f32) {
        let separation = self.separate(boids);
        let alignment = self.align(boids);
        let cohesion = self.cohere(boids);
        let unblock = self.view_unblocking(boids);

        let separation = separation * 1.5; // Increase separation for cleaner flocks
        let alignment = alignment * 1.0; // Keep moderate alignment
        let cohesion = cohesion * 1.2; // Increase cohesion for tighter groups
        let unblock = unblock * 0.3; //Increase side-step decision making

        self.apply_force(separation);
        self.apply_force(alignment);
        self.apply_force(cohesion);
        self.apply_force(unblock);

        self.update_with_delta(delta_time);
    }

    fn apply_force(&mut self, force: Vec2) {
        self.acceleration += force;
    }

    fn update_with_delta(&mut self, delta_time: f32) {
        // Scale movement by delta time (60fps = ~0.0167 delta)
        let time_scale = delta_time * 60.0; // Normalise to 60fps equivalent

        // Smooth the acceleration over time
        let smoothing_factor = 0.7; //(0.0 = no smoothing, 1.0 = maximum smoothing)
        self.smoothed_acceleration = self.smoothed_acceleration.lerp(self.acceleration, 1.0 - smoothing_factor);
        
        // Use smoothed acceleration
        self.velocity += self.smoothed_acceleration * time_scale;
        self.velocity = self.velocity.clamp_length_max(self.max_speed);
        self.position += self.velocity * time_scale;

        // Wrap around screen edges
        if self.position.x < 0.0 {
            self.position.x = self.width;
        }
        if self.position.x > self.width {
            self.position.x = 0.0;
        }
        if self.position.y < 0.0 {
            self.position.y = self.height;
        }
        if self.position.y > self.height {
            self.position.y = 0.0;
        }

        self.acceleration = Vec2::ZERO;
    }

    fn seek(&self, target: Vec2) -> Vec2 {
        // Calculate desired velocity (target - current position)
        let desired = target - self.position;

        // Safe normalization check
        if desired.length() < 0.001 {
            return Vec2::ZERO;
        }

        // Set magnitude to max speed
        let desired = desired.normalize() * self.max_speed;

        // Calculate steering force (desired - current velocity)
        let steer = desired - self.velocity;

        // Limit steering force
        steer.clamp_length_max(self.max_force)
    }

    fn separate(&self, boids: &Vec<Boid>) -> Vec2 {
        let desired_separation: f32 = 19.0;
        let mut sum = Vec2::ZERO;
        let mut count = 0;

        for other in boids {
            let distance = self.position.distance(other.position);

            if self != other && distance > 0.001 && distance < desired_separation {
                // Added minimum distance check
                let mut diff = self.position - other.position;

                // Safe normalization
                if diff.length() > 0.001 {
                    diff = diff.normalize() / distance;
                    sum += diff;
                    count += 1;
                }
            }
        }

        if count > 0 {
            sum /= count as f32;

            // Safe normalization
            if sum.length() > 0.001 {
                sum = sum.normalize() * self.max_speed;
                let steer = sum - self.velocity;
                steer.clamp_length_max(self.max_force)
            } else {
                Vec2::ZERO
            }
        } else {
            Vec2::ZERO
        }
    }

    fn align(&self, boids: &Vec<Boid>) -> Vec2 {
        let desired_view_angle: f32 = 4.0 / 2.0; //170 degrees in radian (half as we are measuring from the center of your vision outward)
        let neighbour_distance = 50.0;

        let mut sum = Vec2::ZERO;
        let mut count = 0;

        //Add up all the velocities and divide by the total to calculate the average velocity
        for other in boids {
            //velocity vector tells us the facing direction
            let d1: Vec2 = self.velocity;

            //the firection from current boid to other boid
            let d2: Vec2 = other.position - self.position;

            //calculate angle between d1 and d2
            let angle = Vec2::angle_to(d1, d2).abs(); //we only care about full range so return absolute value (alwasy positive)

            let distance = self.position.distance(other.position);

            if self != other && angle < desired_view_angle && distance < neighbour_distance {
                sum += other.velocity;
                count += 1; //for an average, keep track of how many boids are within the distance
            }
        }

        if count > 0 {
            sum /= count as f32;
            if sum.length() > 0.001 {
                sum = sum.normalize() * self.max_speed;
            } else {
                sum = Vec2::ZERO;
            }

            let steer = sum - self.velocity;
            let steer = steer.clamp_length_max(self.max_force);
            steer
        } else {
            Vec2::ZERO //if no close boids are found, the steering force is zero
        }
    }

    fn cohere(&self, boids: &Vec<Boid>) -> Vec2 {
        let neighbour_distance: f32 = 40.0; // Increase for stronger grouping

        let mut sum = Vec2::ZERO;
        let mut count = 0;
        for other in boids {
            let distance = self.position.distance(other.position);
            if self != other && distance < neighbour_distance {
                sum += other.position;
                count += 1;
            }
        }
        if count > 0 {
            sum /= count as f32;
            self.seek(sum)
        } else {
            Vec2::ZERO
        }
    }

    fn view_unblocking(&self, boids: &Vec<Boid>) -> Vec2 {
        let desired_view_angle: f32 = 0.6 / 2.0;
        let mut blocking_severity = 0.0;

        // Calculate how "blocked" we are
        for other in boids {
            let d1: Vec2 = self.velocity;
            let d2: Vec2 = other.position - self.position;
            let angle = Vec2::angle_to(d1, d2).abs();
            let distance = self.position.distance(other.position);

            if self != other && angle < desired_view_angle && distance < 40.0 {
                let angle_factor = 1.0 - (angle / desired_view_angle);
                let distance_factor = 1.0 - (distance / 40.0);
                blocking_severity += angle_factor * distance_factor;
            }
        }

        if blocking_severity < 0.3 {
            return Vec2::ZERO;
        }

        //Check if velocity is zero before normalizing
        if self.velocity.length() < 0.001 {
            return Vec2::ZERO; // Can't determine lateral direction with zero velocity
        }

        let d1: Vec2 = self.velocity.normalize();
        let lateral_right = Vec2::new(d1.y, -d1.x);
        let lateral_left = Vec2::new(-d1.y, d1.x);

        // Rest of the function remains the same...
        let look_ahead = 25.0;
        let right_pos = self.position + (lateral_right * look_ahead);
        let left_pos = self.position + (lateral_left * look_ahead);

        let mut right_crowding = 0;
        let mut left_crowding = 0;

        for other in boids {
            if self != other {
                if right_pos.distance(other.position) < 20.0 {
                    right_crowding += 1;
                }
                if left_pos.distance(other.position) < 20.0 {
                    left_crowding += 1;
                }
            }
        }

        let chosen_direction = if left_crowding < right_crowding {
            lateral_left
        } else {
            lateral_right
        };

        let base_strength = 0.2;
        let severity_multiplier = (blocking_severity * 2.0).min(1.0);

        chosen_direction * base_strength * severity_multiplier * self.max_force
    }
}

///The Flock struct is a collection of Vec<Boid> associated with a flockid
#[wasm_bindgen]
pub struct Flock {  // Make this public
    flockid: usize,   //For flock-level control
    boids: Vec<Boid>, //The vec of each boid within this flock
    width: f32,       // Dynamic width
    height: f32,      // Dynamic height
}


#[wasm_bindgen]
impl Flock {
    #[wasm_bindgen(constructor)]
    pub fn new(amt: usize, width: f32, height: f32) -> Flock {
        //create n boids
        let mut boids: Vec<Boid> = Vec::with_capacity(amt);
        for _i in 0..amt {  // Fix unused variable warning
            let boid: Boid = Boid::spawn(width, height);  // Pass parameters
            boids.push(boid); //push boid into boid vec
        }

        //return the flock
        Flock {
            flockid: 1, //TODO: Add a unique denominator here
            boids,      // Simplified
            width,
            height,
        }
    }

    #[wasm_bindgen]
    pub fn get_velocities(&mut self) -> Vec<f32> {
        let mut _vec = Vec::new();

        for boid in &self.boids {
            _vec.push(boid.velocity.x);  //one boid with be position n and n + 1
            _vec.push(boid.velocity.y);
        }
        _vec
    }

    #[wasm_bindgen]
    pub fn update_with_delta(&mut self, delta_time: f32) {
        // Calculate dynamic grid based on current dimensions
        let grid_resolution = 40.0;
        let cols = (self.width / grid_resolution) as usize + 1;
        let rows = (self.height / grid_resolution) as usize + 1;

        let boids_clone = self.boids.clone();
        let mut grid: Vec<Vec<Vec<usize>>> = vec![vec![Vec::new(); rows]; cols];

        // PHASE 1: Store boid indices in grid
        for (i, boid) in boids_clone.iter().enumerate() {
            let col = ((boid.position.x / grid_resolution) as usize).min(cols - 1);
            let row = ((boid.position.y / grid_resolution) as usize).min(rows - 1);
            grid[col][row].push(i);
        }

        // PHASE 2: Process each boid
        for boid in self.boids.iter_mut() {
            let col = ((boid.position.x / grid_resolution) as usize).min(cols - 1);
            let row = ((boid.position.y / grid_resolution) as usize).min(rows - 1);

            let mut neighbors = Vec::new();

            // Check 3x3 grid around current boid
            for dx in -1..=1_i32 {
                for dy in -1..=1_i32 {
                    let check_col = (col as i32 + dx).max(0).min((cols - 1) as i32) as usize;
                    let check_row = (row as i32 + dy).max(0).min((rows - 1) as i32) as usize;

                    for &neighbor_idx in &grid[check_col][check_row] {
                        if neighbor_idx < boids_clone.len() {
                            neighbors.push(boids_clone[neighbor_idx].clone());
                        }
                    }
                }
            }

            if neighbors.is_empty() {
                neighbors.push(boid.clone());
            }

            // Apply flocking forces
            let separation = boid.separate(&neighbors);
            let alignment = boid.align(&neighbors);
            let cohesion = boid.cohere(&neighbors);
            let unblock = boid.view_unblocking(&neighbors);

            boid.apply_force(separation * 1.2);
            boid.apply_force(alignment * 0.9);
            boid.apply_force(cohesion * 0.9);
            boid.apply_force(unblock * 0.3);
            boid.update_with_delta(delta_time);
        }
    }

    #[wasm_bindgen]
    pub fn get_positions(&self) -> Vec<f32> {
        let mut positions = Vec::new();
        for boid in &self.boids {
            positions.push(boid.position.x);
            positions.push(boid.position.y);
        }
        positions
    }

    #[wasm_bindgen]
    pub fn resize(&mut self, new_width: f32, new_height: f32) {
        self.width = new_width;
        self.height = new_height;

        // Update all boids with new dimensions
        for boid in &mut self.boids {
            boid.width = new_width;
            boid.height = new_height;

            // Clamp existing boids to new bounds
            boid.position.x = boid.position.x.min(new_width);
            boid.position.y = boid.position.y.min(new_height);
        }
    }
}

// #[wasm_bindgen]
// pub fn setup() {
//     //Run this initialisation
//     let flock: Flock = Flock::new(600, width, height); //Create a new flock with n boids
// }