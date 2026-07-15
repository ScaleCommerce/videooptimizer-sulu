// @flow
import {viewRegistry} from 'sulu-admin-bundle/containers';
import fieldRegistry from 'sulu-admin-bundle/containers/Form/registries/fieldRegistry';
import Settings from './views/Settings';
import Libraries from './views/Libraries';
import Videos from './views/Videos';
import VideoOptimizerField from './fields/VideoOptimizerField';
import './styles.css';

// Custom admin views for the VideoOptimizer settings and library management.
viewRegistry.add('scale_videooptimizer_settings', Settings);
viewRegistry.add('scale_videooptimizer_libraries', Libraries);
viewRegistry.add('scale_videooptimizer_videos', Videos);

// Content field type used by the `video_optimizer` property in page templates.
fieldRegistry.add('video_optimizer', VideoOptimizerField);
