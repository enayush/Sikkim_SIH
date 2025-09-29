import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const indstyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 60, // This will be overridden by dynamic style
  },
  chatbotButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#DF8020',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    height: 220,
    marginTop: -20, // Slight overlap with header for visual appeal
  },
  carouselItem: {
    width: width,
    height: 220,
  },
  carouselImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  carouselTextContainer: {
    padding: 12,
  },
  carouselMonasteryName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  carouselMonasteryInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  smallButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  smallButton: {
    flexDirection: 'row',
    backgroundColor: '#DF8020',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  popularSection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  popularHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  popularScrollContainer: {
    paddingHorizontal: 16,
  },
  popularMonasteryCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularMonasteryImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  popularMonasteryInfo: {
    padding: 16,
  },
  popularMonasteryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  popularMonasteryDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  goldStar: {
    color: '#FFD700',
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 260, // Match the new card height (180px image + ~80px info)
    paddingHorizontal: 20,
  },
  moreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DF8020',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 260,
    paddingHorizontal: 40,
    width: 150,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  mapPreviewContainer: {
    height: 120,
    marginTop: 2,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // This makes the map fill the container
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.26)', // A slight dark overlay for text readability
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default indstyle;
