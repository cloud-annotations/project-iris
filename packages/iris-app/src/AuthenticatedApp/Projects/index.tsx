import React from "react";

import { IProject } from "@iris/store/dist/project";
import { Link } from "react-router-dom";

import { useProjects } from "@iris/api";

interface ProjectProps {
  projects: IProject[];
}

function ProjectsView({ projects }: ProjectProps) {
  return (
    <ul>
      {projects.map((project) => {
        return (
          <li>
            <Link to={`/projects/${project.id}`}>
              <span>{project.name}</span>
              <span>{project.id}</span>
              <span>{new Date(project.created).getFullYear()}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectsController() {
  const { projects, error } = useProjects();

  if (projects !== undefined) {
    return <ProjectsView projects={projects} />;
  }

  if (error === undefined) {
    return <div>LOADING...</div>;
  }

  return <div>ERROR</div>;
}

export default ProjectsController;