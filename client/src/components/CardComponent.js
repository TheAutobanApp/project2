import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import { Icon, Label } from 'semantic-ui-react';
import ReactMarkdown from 'react-markdown';
import Slide from 'react-reveal/Slide';
import DropMenu from './DropMenu';
import LabelMenu from './LabelMenu';
import { AutoContext } from '../AutoContext';
import { useDrag } from 'react-dnd'
import { ItemTypes } from './utils/Constants'

function CardComponent(props) {
  const context = useContext(AutoContext);
  const [labels, setLabels] = useState([]);
  const [availLabels, setAvailLabels] = useState([]);

  const [{isDragging}, drag] = useDrag({
    item: { type: ItemTypes.TASK },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  // on mount and when project label context is updated,
  // find which labels are on the task and fill the available labels and task labels accordingly
  useEffect(() => {
    // get task label ids
    const foundIndex = context[6].findIndex(
      (task) => task._id === props.id,
    );
    let cardLabels = context[6][foundIndex].labels;
    const taskLabels = [];
    // create a copy of project labels from context and find matching ids from task
    const projLabels = Array.from(context[12].projectLabels);
    cardLabels.forEach((label) => {
      if (label !== null) {
        let foundIndex = projLabels.findIndex(
          (item) => item.id_label === label,
        );
        const newLabel = projLabels[foundIndex];
        if (newLabel) {
          taskLabels.push(newLabel);
          projLabels.splice(foundIndex, 1);
        }
      }
    });
    setLabels(taskLabels);
    setAvailLabels(projLabels);
  }, [context[12].projectLabels, context[6]]);

  useEffect(() => {
    if (isDragging) {
      context[11]({...context[10], drag: props.id})
      console.log('dragging', props.id);
    }
  }, [isDragging])

  // move added card label to available state and remove from it's label state
  const handleLabelDelete = (i) => {
    // create copies of state arrays
    const availCopy = Array.from(availLabels);
    const labelsCopy = Array.from(labels);
    // find the index of the deleted label using the label id
    const foundIndex = labels.findIndex(
      (item) => item.id_label === i,
    );
    // copy of deleted label object, push into avaiable array and remove from task label array
    const deleteLabel = labelsCopy[foundIndex];
    availCopy.push(deleteLabel);
    labelsCopy.splice(foundIndex, 1);
    // send id_label to be removed from task
    console.log('pretest')
    axios.put(`/api/mdb/?_id=${props.id}&id_project=${context[10].project}`, {
      labels: labelsCopy.map((item) => item.id_label),
    }).then((result) => {console.log(result, 'sent')});
    // update state with new copies
    setLabels(labelsCopy);
    setAvailLabels(availCopy);
  };

  return (
    <Slide top cascade>
      <Card className="card" ref={drag}>
        <Card.Body>
          <Card.Title>
            {props.title}
            <DropMenu option="card" id={props.id} column={props.column} />
          </Card.Title>
          <Card.Text>
            <ReactMarkdown source={props.description} />
          </Card.Text>
          <Card.Text className="text-muted created-by">
            Created by {props.createdBy}
          </Card.Text>
        </Card.Body>
        <Card.Footer className="flex-row card-footer">
          {/* map through task labels array and render each */}
          {labels.map((item, i) => {
            return (
              <Label
                size="mini"
                color={item.color}
                circular
                id={item.id_label}
                key={i}
              >
                {item.label_name}
                <Icon
                  name="delete"
                  onClick={() => handleLabelDelete(item.id_label)}
                />
              </Label>
            );
          })}
          {/* only allow 3 labels by rendering add button when task label array length is less than 3*/}
          {labels.length < 5 && (
            <LabelMenu
              id={props.id}
              labels={[
                labels,
                setLabels,
                availLabels,
                setAvailLabels,
              ]}
            />
          )}
        </Card.Footer>
      </Card>
    </Slide>
  );
}
export default CardComponent;
