import { useRef, useEffect, useState } from "react";
import "./ComponentSelector.css";
import assetsMap from "../../public/assets/asset-map";
import selectComponent from "../../game-logic/input";

const ComponentButton = (props) => {
  return (
    <>
      <div
        className="component-slot"
        style={{
          backgroundImage: `url(${
            props.selected ? assetsMap.UI.selectedslot.src : assetsMap.UI.inventoryslot.src
          })`,
        }}
      >
        {props.unlocked ? (
          <button
            key={`${props.compType}.${props.compName}-button`}
            className="component-icon"
            style={{
              backgroundImage: `url(${assetsMap.components[props.compType][props.compName].src})`,
            }}
            onClick={props.onClick}
          />
        ) : (
          <button
            key={`${props.compType}.${props.compName}-div`}
            className="component-icon"
            style={{
              backgroundImage: `url(${assetsMap.components[props.compType][props.compName].src})`,
              opacity: 0.25,
            }}
            onClick={() => {}}
          />
        )}
      </div>
    </>
  );
};

const ComponentSelector = (props) => {
  return (
    <>
      <div className="component-selector">
        {Object.keys(props.components.unlocked).map((classname) => (
          <div className="component-row" key={`${classname}-row`}>
            <ComponentButton
              key={`${classname}-default`}
              compType={classname}
              compName="default"
              onClick={() => {}}
              unlocked={false}
            />
            {Object.keys(props.components.unlocked[classname]).map((componentname) => (
              <ComponentButton
                key={`${classname}.${componentname}-compchoice`}
                compType={classname}
                compName={componentname}
                onClick={() => {
                  selectComponent(props.gameID, props.userID, classname, componentname);
                }}
                unlocked={props.components.unlocked[classname][componentname]}
                selected={props.components.equipped[classname] === componentname}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default ComponentSelector;
