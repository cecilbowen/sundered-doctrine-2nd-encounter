import TriangleIcon from '@mui/icons-material/ChangeHistoryTwoTone';
import PropTypes from 'prop-types';

const DiamondIcon = () => {
    return <div className="diamond-button">
        <TriangleIcon className="diamond-top" />
        <TriangleIcon className="diamond-bottom" />
    </div>;
};

export default DiamondIcon;