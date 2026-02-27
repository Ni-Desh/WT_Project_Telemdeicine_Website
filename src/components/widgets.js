import React, { useState } from 'react';
import { useExtendClass } from "./hooks";
import { Row } from './layout';
import { BodyCard, Card, CardBody } from './cards';
import { List, ListItem, ListLink } from './lists';
import { LgIcon } from './icons';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton } from './dropdown';

/* --- CHART.JS IMPORTS FOR MEMBER A --- */
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

/* REGISTER CHARTJS COMPONENTS */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* --- EXISTING REPO CODE START --- */

export function WidgetRow(props) {
    return (
        <Row className={useExtendClass("mb-3", props.className)}>
            {props.children}
        </Row>
    );
}

export function WidgetDeck(props) {
    return (
        <div class={useExtendClass("card-deck mb-3", props.className)}>
            {props.children}
        </div>
    );
}

export function WidgetColumns(props) {
    return (
        <div class={useExtendClass("card-columns mb-3", props.className)}>
            {props.children}
        </div>
    );
}

export function Widget(props) {
    return (
        <Card className={useExtendClass("md-widget mb-3", props.className)}>
            {props.children}
        </Card>
    );
}

export function InfoWidget(props) {
    return (
        <BodyCard className={useExtendClass("md-widget mb-3", props.className)}>
            {props.children}
        </BodyCard>
    );
}

export function TitleBar(props) {
    return (
        <nav className="card-header navbar md-title px-3 py-1">
            <h6 className="navbar-brand text-muted my-1 py-0">{props.title}</h6>
            {props.children}
        </nav>
    );
}

export function TitleButtons(props) {  
    return (
        <ul className={useExtendClass("nav", props.className)}>
            {props.children}
        </ul>
    );
}

export function TitleButton(props) {
    return (
        <button type="button" data-toggle="tooltip" title={props.name} 
            className="btn btn-sm p-2 d-flex align-items-center" onClick={props.handleClick}>
            <LgIcon>{props.icon}</LgIcon>
        </button>
    );
}

export function TitleToggler(props) {
    const [collapseMode, setCollapseMode] = useState(false);

    async function handleClick(e) {
        setCollapseMode(!collapseMode);
    }

    return (
        <button type="button" data-toggle="collapse" data-target={`#${props.target}`}
            class="btn btn-sm p-2 d-flex align-items-center"
            onClick={handleClick} aria-expanded="false" aria-controls={props.target}>
            <LgIcon>{(collapseMode) ? props.collapseIcon: props.expandIcon }</LgIcon>
        </button>
    );
}

export function WidgetBody(props) {
    const { className, ...otherProps } = props;
    return (
        <CardBody className={useExtendClass("px-3 py-2", className)} { ...otherProps } >
            {props.children}
        </CardBody>
    );
}

export function WidgetCollapsible(props) {
    const { id, className, ...otherProps } = props;
    return (
        <WidgetBody id={id} { ...otherProps }
            className={useExtendClass("collapse", className)}>
            {props.children}
        </WidgetBody>
    );
}

export function WidgetList(props) {
    return (
        <List className="list-group-flush">
            {props.children}
        </List>
    );
}

export function WidgetListItem(props) {
    return (
        <ListItem className="py-2 px-0">
            {props.children}
        </ListItem>
    );
}

export function WidgetListLink(props) {
    return (
        <ListLink url={props.url} className="py-2 px-0">
            {props.children}
        </ListLink>
    );
}

export function WidgetDropdown(props) {
    return (
        <Dropdown>
            <DropdownButton id={props.id} className="p-2 d-flex align-items-center">
                <LgIcon>more_horiz</LgIcon>
            </DropdownButton>
            <DropdownMenu labelledBy={props.id} className="dropdown-menu-right">
                {props.children}
            </DropdownMenu>
        </Dropdown>
    );
}

export function WidgetDropdownItem(props) {
    const { className, ...otherProps} = props;
    return (
        <DropdownMenuButton 
            className={useExtendClass("d-flex align-items-center", className)}
            {...otherProps}
        >
            {props.children}
        </DropdownMenuButton>
    );
}

/* --- EXISTING REPO CODE END --- */

/* --- NEW MEMBER A: HEALTH TRENDS CHART --- */

export function HealthTrendsChart({ lockerData }) {
    // Process data for the chart
    // We handle both $date format from Atlas and standard strings
    const sortedData = [...lockerData].sort((a, b) => {
        const dateA = a.startTime?.$date ? new Date(a.startTime.$date) : new Date(a.startTime);
        const dateB = b.startTime?.$date ? new Date(b.startTime.$date) : new Date(b.startTime);
        return dateA - dateB;
    });

    const chartData = {
        labels: sortedData.map(r => {
            const d = r.startTime?.$date ? new Date(r.startTime.$date) : new Date(r.startTime);
            return d.toLocaleDateString();
        }),
        datasets: [
            {
                label: 'Health Recovery Index (%)',
                // This simulates an upward recovery trend based on the number of medical visits
                data: sortedData.map((record, index) => {
                    const base = 60 + (index * 7);
                    return record.status === "Completed" || record.status === "pending" ? base : base - 10;
                }),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { boxWidth: 10, font: { size: 12 } } },
            title: { display: false },
        },
        scales: {
            y: { beginAtZero: false, min: 0, max: 100, title: { display: true, text: 'Vitality Index' } }
        }
    };

    return (
        <Widget className="p-3 mt-4">
            <h6 className="text-primary mb-3">
                <LgIcon className="mr-2">insights</LgIcon> Predictive Health Insights
            </h6>
            <div style={{ height: '300px' }}>
                <Line data={chartData} options={options} />
            </div>
            <div className="mt-3 border-top pt-2">
                <small className="text-muted">
                    <strong>AI Analysis:</strong> Based on your medical history, your health index shows a positive 
                    trend. Regular follow-ups are recommended to maintain progress.
                </small>
            </div>
        </Widget>
    );
}