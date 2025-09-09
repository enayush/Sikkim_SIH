/*
  # Create monasteries and reviews tables

  1. New Tables
    - `monasteries`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text) 
      - `era` (text)
      - `description` (text)
      - `history` (text)
      - `cultural_significance` (text)
      - `images` (text array)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `created_at` (timestamp)
    - `reviews`
      - `id` (uuid, primary key)
      - `monastery_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key) 
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access on monasteries
    - Add policies for authenticated users to manage their reviews
*/

-- Create monasteries table
CREATE TABLE IF NOT EXISTS monasteries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  era text NOT NULL,
  description text NOT NULL,
  history text NOT NULL,
  cultural_significance text NOT NULL,
  images text[] DEFAULT '{}',
  latitude decimal,
  longitude decimal,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monastery_id uuid REFERENCES monasteries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE monasteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Monasteries policies (public read access)
CREATE POLICY "Anyone can view monasteries"
  ON monasteries FOR SELECT
  TO public
  USING (true);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample monasteries data
INSERT INTO monasteries (name, location, era, description, history, cultural_significance, images, latitude, longitude) VALUES
  ('Hemis Monastery', 'Ladakh, India', '17th Century', 'Largest and wealthiest monastery in Ladakh, famous for its annual Hemis Festival', 'Founded in 1630 by the first incarnation of Stagsang Raspa Nawang Gyatso, under the patronage of King Sengge Namgyal. The monastery belongs to the Drukpa Lineage of the Kagyu school of Tibetan Buddhism.', 'Home to rare Buddhist manuscripts, thangkas, and the largest Thangka in Ladakh unveiled every 12 years during Hemis Festival.', '{"https://images.pexels.com/photos/2050718/pexels-photo-2050718.jpeg"}', 34.2676, 77.6663),
  
  ('Tashilhunpo Monastery', 'Shigatse, Tibet', '15th Century', 'Seat of the Panchen Lama and one of the Big Six monasteries of the Gelug school', 'Founded in 1447 by Gedun Drupa, the 1st Dalai Lama. It has been the traditional seat of successive Panchen Lamas, the second highest ranking tulku lineage in the Gelug tradition of Tibetan Buddhism.', 'Important center for Tibetan Buddhist learning with a massive statue of Maitreya Buddha and extensive monastic university.', '{"https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg"}', 29.2675, 88.8780),
  
  ('Rongbuk Monastery', 'Tibet', '20th Century', 'Highest monastery in the world at 5,009m, with stunning views of Mount Everest', 'Founded in 1902 by Ngawang Tenzin Norbu, a Nyingmapa lama. It was built at the base of Mount Everest and served as a base camp for early Everest expeditions.', 'Unique position offering spiritual connection with the worlds highest peak, blending adventure tourism with Buddhist pilgrimage.', '{"https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg"}', 28.1542, 86.8524),
  
  ('Tengboche Monastery', 'Nepal', '20th Century', 'Sacred monastery in the Everest region, destroyed and rebuilt multiple times', 'Originally built in 1916, destroyed by earthquake in 1934, rebuilt, then destroyed by fire in 1989 and rebuilt again. It is the largest gompa in the Khumbu region of Nepal.', 'Spiritual center for Sherpa community and trekkers, famous for its location with panoramic views of Everest, Lhotse, and Ama Dablam.', '{"https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg"}', 27.8360, 86.7644),
  
  ('Samye Monastery', 'Tibet', '8th Century', 'First Buddhist monastery built in Tibet, template for later monasteries', 'Built between 775-779 CE during the reign of Trisong Detsen, designed by Padmasambhava. It represents the universe according to Buddhist cosmology with its unique architectural layout.', 'Birthplace of Tibetan Buddhism as an organized religion, featuring the first ordination of Tibetan monks and unique mandala architecture.', '{"https://images.pexels.com/photos/1770808/pexels-photo-1770808.jpeg"}', 29.4248, 90.9379),
  
  ('Drepung Monastery', 'Lhasa, Tibet', '15th Century', 'Once the largest monastery in the world, housed up to 10,000 monks', 'Founded in 1416 by Jamyang Choge, a disciple of Tsongkhapa. It was the principal seat of the Gelug school and residence of the Dalai Lamas until the 5th Dalai Lama moved to the Potala Palace.', 'Former seat of political and spiritual power in Tibet, known as the Rice Heap due to its white buildings cascading down the hillside.', '{"https://images.pexels.com/photos/3225529/pexels-photo-3225529.jpeg"}', 29.6630, 91.0535),
  
  ('Sera Monastery', 'Lhasa, Tibet', '15th Century', 'Famous for its debating monks and traditional Buddhist philosophical education', 'Founded in 1419 by Jamchen Chojey, a disciple of Tsongkhapa. One of the great three Gelug university monasteries of Tibet, along with Drepung and Ganden.', 'Renowned center for Buddhist philosophical debate, preserving ancient traditions of logical argumentation and Buddhist scholarship.', '{"https://images.pexels.com/photos/2832381/pexels-photo-2832381.jpeg"}', 29.7019, 91.1322),
  
  ('Ganden Monastery', 'Tibet', '15th Century', 'First monastery of the Gelug school, founded by Tsongkhapa himself', 'Founded in 1409 by Tsongkhapa, the founder of the Gelug school. It was the main seat of the Ganden Tripa, the head of the Gelug school.', 'Mother monastery of the Gelug tradition, severely damaged during Cultural Revolution but being gradually restored, symbol of resilience.', '{"https://images.pexels.com/photos/1770810/pexels-photo-1770810.jpeg"}', 29.7344, 91.4764),
  
  ('Labrang Monastery', 'Gansu, China', '18th Century', 'One of the six great monasteries of the Gelug school outside Tibet', 'Founded in 1709 by the 1st Jamyang Zheptse. It became one of the most important centers of Tibetan Buddhist learning outside of Tibet proper.', 'Major center for Tibetan Buddhist education with six institutes of learning, important for preserving Tibetan culture and language.', '{"https://images.pexels.com/photos/3225532/pexels-photo-3225532.jpeg"}', 35.2428, 102.5081),
  
  ('Kumbum Monastery', 'Qinghai, China', '16th Century', 'Birthplace of Tsongkhapa, founder of the Gelug school', 'Built in 1583 at the birthplace of Tsongkhapa. Legend says a sandalwood tree grew from drops of blood from Tsongkhapaś umbilical cord, with leaves bearing images of Buddha.', 'Sacred pilgrimage site marking the birthplace of one of Tibetan Buddhisms most important figures, featuring unique butter sculptures.', '{"https://images.pexels.com/photos/2050717/pexels-photo-2050717.jpeg"}', 36.6283, 101.5761),
  
  ('Tso Pema Monastery', 'Himachal Pradesh, India', '8th Century', 'Sacred lake monastery associated with Padmasambhava and Mandarava', 'According to legend, this is where Padmasambhava and his consort Mandarava were burned alive by the local king but emerged unharmed from a lake of fire that became the sacred Tso Pema lake.', 'Important pilgrimage site for both Hindus and Buddhists, believed to be blessed by Padmasambhava with healing and purifying powers.', '{"https://images.pexels.com/photos/1770811/pexels-photo-1770811.jpeg"}', 32.0575, 76.5449),
  
  ('Mindrolling Monastery', 'Uttarakhand, India', '17th Century', 'Important Nyingma monastery and center for Buddhist studies', 'Originally founded in Tibet in 1676, re-established in India in 1965 by Mindrolling Trichen. It is one of the six principal monasteries of the Nyingma tradition.', 'Major center for preserving Nyingma teachings and texts, known for its comprehensive Buddhist education and beautiful architecture.', '{"https://images.pexels.com/photos/3225533/pexels-photo-3225533.jpeg"}', 30.3255, 78.0436),
  
  ('Namdroling Monastery', 'Karnataka, India', '20th Century', 'Largest teaching center of Nyingma lineage in the world', 'Established in 1963 by Drubwang Penor Rinpoche in Bylakuppe Tibetan settlement. Known as the Golden Temple for its spectacular golden Buddhist statues.', 'Major center for preserving and teaching Nyingma tradition, home to thousands of monks and nuns with impressive golden Buddha statues.', '{"https://images.pexels.com/photos/2832380/pexels-photo-2832380.jpeg"}', 12.4264, 75.9844),
  
  ('Ghum Monastery', 'West Bengal, India', '19th Century', 'Oldest Tibetan Buddhist monastery in Darjeeling hills', 'Built in 1875 by Lama Sherab Gyatso, it belongs to the Gelug sect. The monastery is famous for its 15-foot high statue of Maitreya Buddha.', 'Important center for Tibetan Buddhism in the Darjeeling region, preserving traditional practices and serving the local Tibetan community.', '{"https://images.pexels.com/photos/1770812/pexels-photo-1770812.jpeg"}', 27.0219, 88.2496),
  
  ('Pemayangtse Monastery', 'Sikkim, India', '17th Century', 'Second oldest monastery in Sikkim, pure Nyingma lineage', 'Founded in 1705 by Lama Lhatsun Chempo, it is a Nyingma monastery and one of the premier monasteries of Sikkim, reserved for pure Tibetan origin monks.', 'Royal monastery of former Sikkim kingdom, known for its seven-tiered wooden sculpture depicting the heavenly palace of Guru Rinpoche.', '{"https://images.pexels.com/photos/3225530/pexels-photo-3225530.jpeg"}', 27.3167, 88.2050);