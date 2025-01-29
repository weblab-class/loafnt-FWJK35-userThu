import { useRef, useEffect, useState } from "react";
import "./ComponentSelector.css";
import assetsMap from "../../public/assets/asset-map";
import selectComponent from "../../game-logic/input";

const ComponentButton = (props) => {
  return (
    <>
      {props.unlocked ? (
        <button
          key={`${props.compType}.${props.compName}-button`}
          className="component-choice"
          style={{
            backgroundImage: `url(${assetsMap.components[props.compType][props.compName].src})`,
          }}
          onClick={props.onClick}
        />
      ) : (
        <div
          key={`${props.compType}.${props.compName}-div`}
          className="component-choice"
          style={{
            backgroundImage: `url(${assetsMap.components[props.compType][props.compName].src})`,
          }}
        ></div>
      )}
    </>
  );
};

const ComponentSelector = (props) => {
  return (
    <>
      <div className="component-selector">
        {Object.keys(props.unlocked).map((classname) => (
          <div className="component-row" key={`${classname}-row`}>
            {classname}
            {Object.keys(props.unlocked[classname]).map((componentname) => (
              <ComponentButton
                key={`${classname}.${componentname}-compchoice`}
                compType={classname}
                compName={componentname}
                onClick={() => {
                  selectComponent(props.gameID, props.userID, classname, componentname);
                }}
                unlocked={props.unlocked[classname][componentname]}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default ComponentSelector;
