import TriangleIcon from '@mui/icons-material/ChangeHistoryTwoTone';
import PropTypes from 'prop-types';

const DiamondIcon = () => {
    return <div className="diamond-button">
        <TriangleIcon sx={{ position: "absolute", top: "-8px", left: "0px" }} />
        <TriangleIcon sx={{ position: "absolute", transform: 'rotate(180deg)', top: "8px", left: "0px" }} />
    </div>;
};

export default DiamondIcon;